#!/usr/bin/env python3
"""
Reconcile S3 product images with the ProductImage table.

Lists every object under s3://{bucket}/products/ and for each key like
  products/{slug}/{position}.{ext}
creates a ProductImage row if:
  1) A product with that slug exists
  2) No ProductImage with that exact key already exists

Also reports orphans (DB rows pointing to missing S3 objects) without
deleting them — manual review required.

Usage:
  pip3 install boto3 python-dotenv psycopg2-binary
  python3 scripts/syncS3ImagesToDB.py
  python3 scripts/syncS3ImagesToDB.py --dry-run
"""
from __future__ import annotations

import argparse
import os
import re
import secrets
import sys

try:
    import boto3
    import psycopg2
    import psycopg2.extras
    from dotenv import load_dotenv
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("Install: pip3 install boto3 python-dotenv psycopg2-binary")
    sys.exit(1)

load_dotenv()

KEY_PATTERN = re.compile(r"^products/([^/]+)/(\d+)\.(jpg|jpeg|png|webp)$", re.IGNORECASE)


def get_s3():
    return boto3.client(
        "s3",
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
        region_name=os.environ.get("AWS_REGION", "us-east-2"),
    )


def get_db():
    dsn = os.environ.get("DATABASE_DIRECT_URL") or os.environ.get("DATABASE_URL")
    if not dsn:
        raise RuntimeError("DATABASE_DIRECT_URL / DATABASE_URL not set")
    return psycopg2.connect(dsn)


def list_all_s3_keys(s3, bucket, prefix="products/"):
    keys = []
    paginator = s3.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
        for obj in page.get("Contents") or []:
            keys.append(obj["Key"])
    return keys


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="Don't write to DB")
    args = ap.parse_args()

    bucket = os.environ.get("S3_BUCKET_NAME", "essentia-products")
    s3 = get_s3()
    conn = get_db()

    print(f"Listing s3://{bucket}/products/ ...")
    s3_keys = list_all_s3_keys(s3, bucket)
    print(f"S3 objects:                 {len(s3_keys)}")

    # Load existing DB state
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("""
            SELECT p.id, p.slug, p.brand, p.name
            FROM "Product" p
        """)
        products = cur.fetchall()
        slug_to_product = {p["slug"]: p for p in products}

        cur.execute('SELECT key FROM "ProductImage"')
        existing_keys = set(r["key"] for r in cur.fetchall())

    print(f"Products in DB:             {len(products)}")
    print(f"ProductImage rows:          {len(existing_keys)}")

    # Classify every S3 key
    to_insert = []          # (product_id, key, alt, position)
    unmatched_slug = []     # S3 keys pointing to unknown slug
    already_in_db = 0
    malformed = []

    for key in s3_keys:
        if key in existing_keys:
            already_in_db += 1
            continue

        m = KEY_PATTERN.match(key)
        if not m:
            malformed.append(key)
            continue

        slug, position_str, _ext = m.group(1), m.group(2), m.group(3)
        position = int(position_str)

        product = slug_to_product.get(slug)
        if not product:
            unmatched_slug.append(key)
            continue

        alt = f"{product['brand']} {product['name']}"
        to_insert.append((product["id"], key, alt, position))

    # Find stale DB rows (DB → S3 missing)
    s3_keys_set = set(s3_keys)
    stale_db = [k for k in existing_keys if k not in s3_keys_set]

    print()
    print("─" * 60)
    print("DIFF SUMMARY")
    print("─" * 60)
    print(f"Already in DB (synced):     {already_in_db}")
    print(f"To insert (new):            {len(to_insert)}")
    print(f"Unmatched slug:             {len(unmatched_slug)}")
    print(f"Malformed S3 keys:          {len(malformed)}")
    print(f"Stale DB rows (not in S3):  {len(stale_db)}")

    if unmatched_slug:
        print("\nSample unmatched (first 5):")
        for k in unmatched_slug[:5]:
            print(f"  {k}")
    if malformed:
        print("\nSample malformed (first 5):")
        for k in malformed[:5]:
            print(f"  {k}")
    if stale_db:
        print("\nSample stale DB rows (first 5):")
        for k in stale_db[:5]:
            print(f"  {k}")

    # Insert new rows
    inserted = 0
    if to_insert and not args.dry_run:
        print(f"\nInserting {len(to_insert)} ProductImage rows...")
        with conn.cursor() as cur:
            for product_id, key, alt, position in to_insert:
                new_id = "c" + secrets.token_hex(12)
                try:
                    cur.execute(
                        """
                        INSERT INTO "ProductImage" (id, "productId", key, alt, position, "createdAt")
                        VALUES (%s, %s, %s, %s, %s, NOW())
                        ON CONFLICT DO NOTHING
                        """,
                        (new_id, product_id, key, alt, position),
                    )
                    if cur.rowcount > 0:
                        inserted += 1
                except Exception as e:
                    print(f"  ! insert failed for {key}: {e}")
        conn.commit()
    elif to_insert:
        print(f"\n[dry-run] would insert {len(to_insert)} rows")

    print()
    print("═" * 60)
    print("RESULT")
    print("═" * 60)
    print(f"Records created:            {inserted}")
    print(f"S3 / DB sync status:        "
          f"{'✓ in sync' if not to_insert and not stale_db else '⚠ diff remaining'}")

    conn.close()


if __name__ == "__main__":
    main()
