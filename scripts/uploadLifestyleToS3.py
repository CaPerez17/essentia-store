#!/usr/bin/env python3
"""
Upload all files under data/lifestyle/ to S3 under the `lifestyle/` prefix.

Preserves the brand folder structure:
  data/lifestyle/armaf/banner_0.png  →  s3://{bucket}/lifestyle/armaf/banner_0.png

Idempotent: uses s3.head_object() to skip files already in S3.

Usage:
  pip3 install boto3 python-dotenv
  python3 scripts/uploadLifestyleToS3.py
  python3 scripts/uploadLifestyleToS3.py --dry-run
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

try:
    import boto3
    from botocore.exceptions import ClientError
    from dotenv import load_dotenv
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("Install: pip3 install boto3 python-dotenv")
    sys.exit(1)

load_dotenv()

LIFESTYLE_DIR = Path("data/lifestyle")

# MIME map
CONTENT_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
}


def get_s3():
    return boto3.client(
        "s3",
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
        region_name=os.environ.get("AWS_REGION", "us-east-2"),
    )


def object_exists(s3, bucket, key):
    try:
        s3.head_object(Bucket=bucket, Key=key)
        return True
    except ClientError as e:
        if e.response["Error"]["Code"] in ("404", "NoSuchKey", "NotFound"):
            return False
        raise


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    bucket = os.environ.get("S3_BUCKET_NAME", "essentia-products")

    if not LIFESTYLE_DIR.exists():
        print(f"Error: {LIFESTYLE_DIR} does not exist.")
        print("Run `npm run lifestyle:download` first.")
        sys.exit(1)

    s3 = None if args.dry_run else get_s3()

    # Gather all files
    files = []
    for p in LIFESTYLE_DIR.rglob("*"):
        if p.is_file() and p.suffix.lower() in CONTENT_TYPES:
            rel = p.relative_to(LIFESTYLE_DIR)
            key = f"lifestyle/{rel.as_posix()}"
            files.append((p, key))

    print(f"Found {len(files)} local lifestyle files")
    print(f"Target bucket: {bucket}\n")

    uploaded = 0
    skipped = 0
    errors = 0

    for path, key in files:
        if s3:
            try:
                if object_exists(s3, bucket, key):
                    skipped += 1
                    continue
            except Exception as e:
                print(f"  ! head_object error for {key}: {e}")
                errors += 1
                continue

        content_type = CONTENT_TYPES.get(path.suffix.lower(), "application/octet-stream")

        if args.dry_run:
            print(f"  [dry] would upload → s3://{bucket}/{key} ({content_type})")
            uploaded += 1
            continue

        try:
            with open(path, "rb") as f:
                s3.put_object(
                    Bucket=bucket,
                    Key=key,
                    Body=f,
                    ContentType=content_type,
                    CacheControl="public, max-age=31536000, immutable",
                )
            print(f"  ✓ {key}")
            uploaded += 1
        except Exception as e:
            print(f"  ✗ {key}: {e}")
            errors += 1

    # Report which brands ended up with at least one banner_0
    with_banner_0 = set()
    for path, key in files:
        if path.name.startswith("banner_0"):
            # brand-slug is the parent dir name
            slug = path.parent.name
            with_banner_0.add(slug)

    print()
    print("═" * 60)
    print("SUMMARY")
    print("═" * 60)
    print(f"Uploaded:        {uploaded}")
    print(f"Already in S3:   {skipped}")
    print(f"Errors:          {errors}")
    print(f"Brands with banner_0: {len(with_banner_0)}")
    print()
    print("Brand slugs with lifestyle images (for TS whitelist):")
    for s in sorted(with_banner_0):
        print(f'  "{s}",')


if __name__ == "__main__":
    main()
