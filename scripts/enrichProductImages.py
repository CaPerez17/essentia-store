#!/usr/bin/env python3
"""
Enrich ESSENTIA products that have 0-1 images by fuzzy-matching against
Disfragancias' public Shopify catalog, downloading the matched images,
normalizing them (800x800 on cream bg), uploading to S3, and inserting
ProductImage rows in the DB.

Usage:
  pip3 install requests Pillow boto3 python-dotenv psycopg2-binary
  python3 scripts/enrichProductImages.py

Idempotent: skips products already with 3+ images. Won't overwrite S3 keys.
"""
from __future__ import annotations

import argparse
import io
import os
import re
import sys
import time
import difflib
import unicodedata
from pathlib import Path
from urllib.parse import urlparse

try:
    import requests
    from PIL import Image
    import boto3
    from dotenv import load_dotenv
    import psycopg2
    import psycopg2.extras
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("Install: pip3 install requests Pillow boto3 python-dotenv psycopg2-binary")
    sys.exit(1)

load_dotenv()

DISF_ENDPOINT = "https://disfragancias.com/products.json"
PAGE_LIMIT = 250
PAGE_DELAY_S = 0.8
IMAGE_DELAY_S = 0.3
IMAGE_TIMEOUT_S = 15
MAX_NEW_IMAGES = 3
FUZZY_THRESHOLD = 0.65
BG_COLOR = (248, 245, 239)  # #F8F5EF cream
TARGET_SIZE = (800, 800)

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/123.0 Safari/537.36"
)


# ──────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────

def normalize(text):
    """Lowercase, strip accents, collapse whitespace."""
    if not text:
        return ""
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = re.sub(r"[^a-z0-9 ]+", " ", text.lower())
    text = re.sub(r"\s+", " ", text).strip()
    return text


def similarity(a, b):
    return difflib.SequenceMatcher(None, normalize(a), normalize(b)).ratio()


def guess_extension(url):
    parsed = urlparse(url)
    path = parsed.path.lower()
    for ext in (".jpg", ".jpeg", ".png", ".webp", ".gif"):
        if path.endswith(ext):
            return "jpg"
    return "jpg"


# ──────────────────────────────────────────────────────────────────────
# Disfragancias catalog
# ──────────────────────────────────────────────────────────────────────

def fetch_disf_catalog():
    """Fetch all products from Disfragancias products.json (paginated)."""
    all_products = []
    page = 1
    while True:
        try:
            res = requests.get(
                DISF_ENDPOINT,
                params={"limit": PAGE_LIMIT, "page": page},
                headers={"User-Agent": USER_AGENT},
                timeout=20,
            )
            res.raise_for_status()
            data = res.json()
        except Exception as e:
            print(f"  ! disfragancias page {page}: {e}")
            break
        products = data.get("products") or []
        if not products:
            break
        all_products.extend(products)
        print(f"  disf page {page}: +{len(products)} (total {len(all_products)})")
        if len(products) < PAGE_LIMIT:
            break
        page += 1
        time.sleep(PAGE_DELAY_S)
    return all_products


def match_best(product, disf_catalog):
    """Find best fuzzy match of our product against Disfragancias catalog."""
    best = None
    best_score = 0.0
    query_brand = product["brand"]
    query_name = product["name"]
    query_combined = f"{query_brand} {query_name}"

    for d in disf_catalog:
        vendor = d.get("vendor") or ""
        title = d.get("title") or ""
        combined = f"{vendor} {title}"
        score = similarity(query_combined, combined)
        if score > best_score:
            best_score = score
            best = d
    return best, best_score


# ──────────────────────────────────────────────────────────────────────
# Image processing
# ──────────────────────────────────────────────────────────────────────

def download_and_normalize(url):
    """Download image, normalize to 800x800 JPEG on cream bg. Returns bytes or None."""
    try:
        res = requests.get(
            url,
            headers={"User-Agent": USER_AGENT},
            timeout=IMAGE_TIMEOUT_S,
        )
        res.raise_for_status()
        img = Image.open(io.BytesIO(res.content))
    except Exception as e:
        print(f"    ! download failed: {e}")
        return None

    try:
        # Handle transparency: paste onto cream bg
        if img.mode in ("RGBA", "LA"):
            bg = Image.new("RGB", img.size, BG_COLOR)
            bg.paste(img, mask=img.split()[-1])
            img = bg
        elif img.mode != "RGB":
            img = img.convert("RGB")

        # Thumbnail preserving aspect, then paste centered on square canvas
        img.thumbnail(TARGET_SIZE, Image.Resampling.LANCZOS)
        canvas = Image.new("RGB", TARGET_SIZE, BG_COLOR)
        ox = (TARGET_SIZE[0] - img.size[0]) // 2
        oy = (TARGET_SIZE[1] - img.size[1]) // 2
        canvas.paste(img, (ox, oy))

        buf = io.BytesIO()
        canvas.save(buf, "JPEG", quality=88, optimize=True)
        return buf.getvalue()
    except Exception as e:
        print(f"    ! normalize failed: {e}")
        return None


# ──────────────────────────────────────────────────────────────────────
# S3 + DB
# ──────────────────────────────────────────────────────────────────────

def get_s3_client():
    return boto3.client(
        "s3",
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
        region_name=os.environ.get("AWS_REGION", "us-east-2"),
    )


def get_db_conn():
    dsn = os.environ.get("DATABASE_DIRECT_URL") or os.environ.get("DATABASE_URL")
    if not dsn:
        raise RuntimeError("DATABASE_DIRECT_URL / DATABASE_URL not set")
    return psycopg2.connect(dsn)


def s3_put(s3, bucket, key, body):
    s3.put_object(
        Bucket=bucket,
        Key=key,
        Body=body,
        ContentType="image/jpeg",
        CacheControl="public, max-age=31536000, immutable",
    )


def insert_product_image(conn, product_id, key, alt, position):
    # Use cuid-ish id; since schema uses @default(cuid()) in Prisma, we let Prisma set it
    # Here we generate a simple random id compatible enough (cuid format collision-free hex).
    import secrets
    new_id = "c" + secrets.token_hex(12)
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO "ProductImage" (id, "productId", key, alt, position, "createdAt")
            VALUES (%s, %s, %s, %s, %s, NOW())
            """,
            (new_id, product_id, key, alt, position),
        )


# ──────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="Don't upload or write DB")
    ap.add_argument("--max-products", type=int, default=0, help="Cap products processed")
    args = ap.parse_args()

    bucket = os.environ.get("S3_BUCKET_NAME", "essentia-products")

    # 1. Fetch Disfragancias catalog
    print("=" * 60)
    print("Fetching Disfragancias catalog...")
    print("=" * 60)
    disf_catalog = fetch_disf_catalog()
    print(f"\nTotal products from Disfragancias: {len(disf_catalog)}\n")
    if not disf_catalog:
        print("No catalog, aborting.")
        return

    # 2. Find ESSENTIA products with 0-1 images
    conn = get_db_conn()
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("""
            SELECT p.id, p.slug, p.brand, p.name,
                   (SELECT COUNT(*) FROM "ProductImage" pi WHERE pi."productId" = p.id) AS image_count
            FROM "Product" p
        """)
        all_products = cur.fetchall()

    targets = [p for p in all_products if p["image_count"] < MAX_NEW_IMAGES]
    if args.max_products > 0:
        targets = targets[: args.max_products]

    print(f"Products needing images: {len(targets)} of {len(all_products)}\n")

    s3 = None if args.dry_run else get_s3_client()

    summary = {"matched": 0, "uploaded": 0, "skipped": 0, "nomatch": 0}

    for p in targets:
        current_count = int(p["image_count"])
        slots_available = MAX_NEW_IMAGES - current_count
        if slots_available <= 0:
            print(f"→ {p['brand']} - {p['name']}: ya tiene {current_count}, skip")
            summary["skipped"] += 1
            continue

        match, score = match_best(p, disf_catalog)
        if not match or score < FUZZY_THRESHOLD:
            print(f"✗ {p['brand']} - {p['name']}: no match (best={score:.2f})")
            summary["nomatch"] += 1
            continue

        # Take images
        images_src = [img.get("src") for img in (match.get("images") or []) if img.get("src")]
        if not images_src:
            print(f"✗ {p['brand']} - {p['name']}: match sin imágenes ({match.get('title')})")
            summary["nomatch"] += 1
            continue

        # Trim to available slots
        to_download = images_src[:slots_available]
        uploaded = 0
        for i, src in enumerate(to_download):
            position = current_count + i
            key = f"products/{p['slug']}/{position}.jpg"

            body = download_and_normalize(src)
            if not body:
                continue

            if args.dry_run:
                print(f"    [dry] would upload {len(body)} bytes → s3://{bucket}/{key}")
            else:
                try:
                    s3_put(s3, bucket, key, body)
                    insert_product_image(
                        conn,
                        p["id"],
                        key,
                        f"{p['brand']} {p['name']}",
                        position,
                    )
                    uploaded += 1
                except Exception as e:
                    print(f"    ! upload/db error: {e}")
                    continue

            time.sleep(IMAGE_DELAY_S)

        if uploaded > 0:
            if not args.dry_run:
                conn.commit()
            print(
                f"✓ {p['brand']} - {p['name']}: +{uploaded} "
                f"imágenes (sim={score:.2f}, match='{match.get('title')}')"
            )
            summary["matched"] += 1
            summary["uploaded"] += uploaded

    conn.close()

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Products processed:   {len(targets)}")
    print(f"Matched + uploaded:   {summary['matched']}")
    print(f"Images uploaded:      {summary['uploaded']}")
    print(f"No match found:       {summary['nomatch']}")
    print(f"Already full (skip):  {summary['skipped']}")


if __name__ == "__main__":
    main()
