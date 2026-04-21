#!/usr/bin/env python3
"""
Download product images from Disfragancias Shopify catalog.

Uses the public products.json endpoint (no auth, no scraping tricks):
  https://disfragancias.com/products.json?limit=250&page=N

Output:
  data/disf_images/{vendor_slug}/{handle}_{index}.jpg   (max 3 per product)
  data/disf_catalog.json                                 (full product list)

Usage:
  python3 scripts/downloadDisfraganciasImages.py
  python3 scripts/downloadDisfraganciasImages.py --max-images 5
  python3 scripts/downloadDisfraganciasImages.py --output-dir data
"""
from __future__ import annotations

import argparse
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
except ImportError:
    print("Install requests:  pip3 install requests")
    sys.exit(1)

BASE_URL = "https://disfragancias.com/products.json"
PAGE_LIMIT = 250
REQUEST_DELAY_S = 0.5
IMAGE_TIMEOUT_S = 15
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/123.0 Safari/537.36"
)


def slugify(text):
    """Filesystem-safe slug: lowercase, ASCII, hyphens."""
    if not text:
        return "unknown"
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return text or "unknown"


def fetch_page(page_num):
    """Fetch one page of the products.json feed."""
    params = {"limit": PAGE_LIMIT, "page": page_num}
    try:
        res = requests.get(
            BASE_URL,
            params=params,
            headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
            timeout=20,
        )
        res.raise_for_status()
        return res.json()
    except Exception as e:
        print(f"  ! page {page_num} failed: {e}")
        return None


def download_image(url, out_path):
    """Download a single image; skip if already exists."""
    if os.path.exists(out_path) and os.path.getsize(out_path) > 0:
        return "skipped"
    try:
        res = requests.get(
            url,
            headers={"User-Agent": USER_AGENT},
            timeout=IMAGE_TIMEOUT_S,
            stream=True,
        )
        res.raise_for_status()
        with open(out_path, "wb") as f:
            for chunk in res.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        return "downloaded"
    except Exception as e:
        # Clean up any partial file
        if os.path.exists(out_path):
            try:
                os.remove(out_path)
            except OSError:
                pass
        return f"error: {e}"


def guess_extension(url):
    """Derive a sensible file extension from a Shopify CDN URL."""
    parsed = urlparse(url)
    path = parsed.path.lower()
    for ext in (".jpg", ".jpeg", ".png", ".webp", ".gif"):
        if path.endswith(ext):
            return ".jpg" if ext in (".jpg", ".jpeg") else ext
    return ".jpg"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--output-dir", default="data", help="Output directory")
    ap.add_argument(
        "--max-images",
        type=int,
        default=3,
        help="Max images to download per product (default 3)",
    )
    args = ap.parse_args()

    out_dir = Path(args.output_dir)
    images_dir = out_dir / "disf_images"
    images_dir.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # 1. Paginate and collect products
    # ------------------------------------------------------------------
    print("=" * 60)
    print("Fetching Disfragancias product catalog...")
    print("=" * 60)

    all_products = []
    page = 1
    while True:
        data = fetch_page(page)
        if not data:
            break
        products = data.get("products", [])
        if not products:
            break
        all_products.extend(products)
        print(f"  page {page}: +{len(products)} products (total {len(all_products)})")
        if len(products) < PAGE_LIMIT:
            break
        page += 1
        time.sleep(REQUEST_DELAY_S)

    if not all_products:
        print("No products found — aborting.")
        sys.exit(1)

    # Save compact catalog JSON
    catalog_path = out_dir / "disf_catalog.json"
    catalog = []
    for p in all_products:
        catalog.append(
            {
                "id": p.get("id"),
                "handle": p.get("handle"),
                "title": p.get("title"),
                "vendor": p.get("vendor"),
                "product_type": p.get("product_type"),
                "tags": p.get("tags", []),
                "images": [
                    {"src": img.get("src"), "alt": img.get("alt"), "position": img.get("position")}
                    for img in (p.get("images") or [])
                ],
                "variants": [
                    {"price": v.get("price"), "available": v.get("available")}
                    for v in (p.get("variants") or [])
                ],
            }
        )
    with open(catalog_path, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    print(f"\nCatalog JSON written: {catalog_path}")

    # ------------------------------------------------------------------
    # 2. Download images per product
    # ------------------------------------------------------------------
    print("\n" + "=" * 60)
    print("Downloading product images...")
    print("=" * 60)

    brands = set()
    downloaded = 0
    skipped = 0
    errors = 0
    products_with_any = 0

    for idx, p in enumerate(all_products, start=1):
        vendor = p.get("vendor") or "unknown"
        handle = p.get("handle") or f"product-{p.get('id','x')}"
        images = p.get("images") or []
        if not images:
            continue

        vendor_slug = slugify(vendor)
        brands.add(vendor)
        vendor_dir = images_dir / vendor_slug
        vendor_dir.mkdir(parents=True, exist_ok=True)

        product_got_any = False
        for i, img in enumerate(images[: args.max_images]):
            src = img.get("src")
            if not src:
                continue
            ext = guess_extension(src)
            out_path = vendor_dir / f"{handle}_{i}{ext}"
            result = download_image(src, str(out_path))
            if result == "downloaded":
                downloaded += 1
                product_got_any = True
            elif result == "skipped":
                skipped += 1
                product_got_any = True
            else:
                errors += 1

        if product_got_any:
            products_with_any += 1

        # Progress indicator every 25 products
        if idx % 25 == 0:
            print(
                f"  [{idx}/{len(all_products)}] downloaded={downloaded} "
                f"skipped={skipped} errors={errors}"
            )

    # ------------------------------------------------------------------
    # 3. Summary
    # ------------------------------------------------------------------
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Products processed:       {len(all_products)}")
    print(f"Products with images:     {products_with_any}")
    print(f"Images downloaded:        {downloaded}")
    print(f"Images skipped (cached):  {skipped}")
    print(f"Image errors:             {errors}")
    print(f"Unique brands:            {len(brands)}")
    print(f"Output:                   {images_dir}/")
    print(f"Catalog:                  {catalog_path}")


if __name__ == "__main__":
    main()
