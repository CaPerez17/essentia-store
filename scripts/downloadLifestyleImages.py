#!/usr/bin/env python3
"""
Download lifestyle/editorial images for ESSENTIA brands from public sources.

Strategy:
  1. Pull the list of brands from the ESSENTIA DB.
  2. For each brand:
     a. Try Disfragancias collection JSON — each Shopify collection has an
        editorial banner image at `collection.image.src`. Handle = slug.
     b. Fall back to product images at position > 0 from the already-cached
        Disfragancias products.json (data/disf_catalog.json if present, else
        fetch it).

Output:
  data/lifestyle/{brand-slug}/banner_{i}.jpg  (up to 3 per brand)
  data/lifestyle_index.json                    (brand → [relative paths])

Usage:
  pip3 install requests Pillow python-dotenv psycopg2-binary
  python3 scripts/downloadLifestyleImages.py
  python3 scripts/downloadLifestyleImages.py --max-per-brand 3

Rate limit: 500ms between requests, 15s timeout.
Idempotent: skips files that already exist.
"""
from __future__ import annotations

import argparse
import difflib
import io
import json
import os
import re
import sys
import time
import unicodedata
from pathlib import Path
from urllib.parse import urlparse

try:
    import requests
    from dotenv import load_dotenv
    import psycopg2
    import psycopg2.extras
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("Install: pip3 install requests python-dotenv psycopg2-binary")
    sys.exit(1)

load_dotenv()

DISF_PRODUCTS_ENDPOINT = "https://disfragancias.com/products.json"
DISF_COLLECTION_ENDPOINT = "https://disfragancias.com/collections/{handle}.json"
PAGE_LIMIT = 250
REQUEST_DELAY_S = 0.5
IMAGE_TIMEOUT_S = 15
MIN_IMAGE_WIDTH = 800  # prefer high-res images for lifestyle use

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/123.0 Safari/537.36"
)


def slugify(text):
    if not text:
        return ""
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return text


def similarity(a, b):
    return difflib.SequenceMatcher(None, a.lower(), b.lower()).ratio()


def get_db():
    dsn = os.environ.get("DATABASE_DIRECT_URL") or os.environ.get("DATABASE_URL")
    if not dsn:
        raise RuntimeError("DATABASE_URL not set")
    return psycopg2.connect(dsn)


# ────────────────────────────────────────────────
# Disfragancias data sources
# ────────────────────────────────────────────────

def fetch_collection_banner(brand_slug):
    """Try to get a brand's collection banner from Disfragancias."""
    url = DISF_COLLECTION_ENDPOINT.format(handle=brand_slug)
    try:
        res = requests.get(
            url,
            headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
            timeout=10,
        )
        if res.status_code != 200:
            return None
        data = res.json()
        collection = data.get("collection") or {}
        image = collection.get("image")
        if isinstance(image, dict) and image.get("src"):
            return image["src"]
        if isinstance(image, str):
            return image
    except Exception:
        return None
    return None


def load_or_fetch_disf_catalog(cache_path):
    """Load cached disf_catalog.json if present, otherwise fetch fresh."""
    if cache_path.exists():
        try:
            with open(cache_path, encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list) and len(data) > 0:
                    print(f"Loaded {len(data)} products from cache")
                    return data
        except Exception:
            pass

    print("Fetching Disfragancias products.json (full catalog)...")
    all_products = []
    page = 1
    while True:
        try:
            res = requests.get(
                DISF_PRODUCTS_ENDPOINT,
                params={"limit": PAGE_LIMIT, "page": page},
                headers={"User-Agent": USER_AGENT},
                timeout=20,
            )
            res.raise_for_status()
            data = res.json()
        except Exception as e:
            print(f"  ! page {page} failed: {e}")
            break
        products = data.get("products") or []
        if not products:
            break
        all_products.extend(products)
        print(f"  page {page}: +{len(products)} (total {len(all_products)})")
        if len(products) < PAGE_LIMIT:
            break
        page += 1
        time.sleep(REQUEST_DELAY_S)

    # Persist a slim catalog for reuse
    slim = [
        {
            "vendor": p.get("vendor"),
            "handle": p.get("handle"),
            "title": p.get("title"),
            "images": [
                {"src": i.get("src"), "width": i.get("width"), "height": i.get("height"), "position": i.get("position")}
                for i in (p.get("images") or [])
            ],
        }
        for p in all_products
    ]
    try:
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(slim, f, ensure_ascii=False, indent=2)
        print(f"Cached to {cache_path}")
    except Exception as e:
        print(f"  ! cache write failed: {e}")
    return slim


def lifestyle_candidates_from_products(disf_catalog, brand):
    """
    Pick lifestyle images from Disfragancias products matching this brand.
    Uses position > 0 (position 0 is usually the plain bottle shot).
    Prefers high-res (width >= MIN_IMAGE_WIDTH).
    """
    candidates = []
    brand_l = brand.lower()
    for product in disf_catalog:
        vendor = (product.get("vendor") or "").lower()
        # Fuzzy brand match
        sim = similarity(vendor, brand_l)
        if sim < 0.75:
            continue
        images = product.get("images") or []
        # Sort by position desc; prefer later positions (lifestyle shots)
        sorted_imgs = sorted(
            images, key=lambda i: i.get("position") or 0, reverse=True
        )
        for img in sorted_imgs:
            src = img.get("src")
            width = img.get("width") or 0
            if not src:
                continue
            if width and width < MIN_IMAGE_WIDTH:
                continue
            if img.get("position", 0) == 0 and len(images) > 1:
                # Skip the main bottle shot when alternatives exist
                continue
            candidates.append(src)
    # De-dup while preserving order
    seen = set()
    unique = []
    for c in candidates:
        if c in seen:
            continue
        seen.add(c)
        unique.append(c)
    return unique


# ────────────────────────────────────────────────
# Download helper
# ────────────────────────────────────────────────

def download_to(url, out_path):
    if out_path.exists() and out_path.stat().st_size > 0:
        return "skipped"
    try:
        res = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=IMAGE_TIMEOUT_S, stream=True)
        res.raise_for_status()
        with open(out_path, "wb") as f:
            for chunk in res.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        return "downloaded"
    except Exception as e:
        if out_path.exists():
            try:
                out_path.unlink()
            except OSError:
                pass
        return f"error: {e}"


# ────────────────────────────────────────────────
# Main
# ────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--output-dir", default="data/lifestyle", help="Output dir")
    ap.add_argument("--max-per-brand", type=int, default=3)
    ap.add_argument("--catalog-cache", default="data/disf_catalog.json")
    args = ap.parse_args()

    out_root = Path(args.output_dir)
    out_root.mkdir(parents=True, exist_ok=True)
    catalog_cache = Path(args.catalog_cache)

    # 1. Brands from ESSENTIA DB
    print("=" * 60)
    print("Loading ESSENTIA brands from DB...")
    print("=" * 60)
    conn = get_db()
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("""
            SELECT brand, COUNT(*) AS cnt
            FROM "Product"
            GROUP BY brand
            ORDER BY cnt DESC
        """)
        brands = [row["brand"] for row in cur.fetchall()]
    conn.close()
    print(f"Brands to process: {len(brands)}")

    # 2. Load Disfragancias catalog (cached or fresh)
    print()
    disf_catalog = load_or_fetch_disf_catalog(catalog_cache)
    print()

    # 3. For each brand, collect candidate URLs
    index = {}  # brand → list of relative paths
    total_downloaded = 0
    total_skipped = 0
    total_errors = 0

    for brand in brands:
        brand_slug = slugify(brand)
        if not brand_slug:
            continue
        brand_dir = out_root / brand_slug
        brand_dir.mkdir(parents=True, exist_ok=True)

        candidates = []

        # Source 1: collection banner
        banner = fetch_collection_banner(brand_slug)
        if banner:
            candidates.append(banner)
        time.sleep(REQUEST_DELAY_S)

        # Source 2: high-res product images from catalog
        from_products = lifestyle_candidates_from_products(disf_catalog, brand)
        for c in from_products:
            if c not in candidates:
                candidates.append(c)

        # Take up to max_per_brand
        candidates = candidates[: args.max_per_brand]

        if not candidates:
            print(f"  ✗ {brand}: no lifestyle candidates")
            continue

        saved = []
        for i, url in enumerate(candidates):
            ext = "jpg"
            parsed = urlparse(url).path.lower()
            if parsed.endswith(".png"):
                ext = "png"
            elif parsed.endswith(".webp"):
                ext = "webp"
            out_path = brand_dir / f"banner_{i}.{ext}"
            result = download_to(url, out_path)
            if result == "downloaded":
                total_downloaded += 1
                saved.append(str(out_path.relative_to(Path("data"))))
            elif result == "skipped":
                total_skipped += 1
                saved.append(str(out_path.relative_to(Path("data"))))
            else:
                total_errors += 1
                print(f"  ! {brand} [{i}] {result}")
            time.sleep(REQUEST_DELAY_S)

        if saved:
            index[brand] = saved
            print(f"  ✓ {brand}: {len(saved)} imagen(es)")

    # 4. Write index
    index_path = Path("data") / "lifestyle_index.json"
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    print()
    print("═" * 60)
    print("SUMMARY")
    print("═" * 60)
    print(f"Brands processed:        {len(brands)}")
    print(f"Brands with lifestyle:   {len(index)}")
    print(f"Images downloaded:       {total_downloaded}")
    print(f"Images skipped (cached): {total_skipped}")
    print(f"Image errors:            {total_errors}")
    print(f"Index file:              {index_path}")
    print(f"Images dir:              {out_root}/")


if __name__ == "__main__":
    main()
