#!/usr/bin/env python3
"""
Build local asset catalog from assets/raw-drive.
Folder = brand, file = product. Output: data/local_assets_catalog.csv
"""
import argparse
import csv
import re
import unicodedata
from pathlib import Path

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def slugify(text: str) -> str:
    if not text:
        return ""
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = re.sub(r"[^\w\s-]", "", text.lower())
    text = re.sub(r"[-\s]+", "-", text).strip("-")
    return text or "product"


def to_display_name(raw: str) -> str:
    """Clean title-cased display name. Do NOT translate."""
    if not raw:
        return raw
    s = re.sub(r"[_-][0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", "", raw, flags=re.I)
    s = re.sub(r"[_-][0-9a-f]{32,}", "", s, flags=re.I)
    s = re.sub(r"[_-]\d+$", "", s)
    s = re.sub(r"[_\-]+", " ", s)
    s = " ".join(s.split())
    words = []
    for w in s.split():
        words.append(w if (len(w) >= 2 and w.isupper()) else w.capitalize())
    result = " ".join(words).strip()
    if not result or len(result) < 2 or result.isdigit():
        result = re.sub(r"[_\-]+", " ", raw).strip()
        result = " ".join(w.capitalize() for w in result.split()) or raw
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assets-path", default="assets/raw-drive", help="Path to asset folders")
    parser.add_argument("--output-dir", default="data", help="Output directory")
    args = parser.parse_args()

    root = Path(args.assets_path)
    if not root.exists():
        print(f"Error: {root} does not exist. Use --assets-path or sync assets.")
        exit(1)

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    rows: list[dict] = []
    seen_slugs: set[str] = set()

    for brand_dir in sorted(root.iterdir()):
        if not brand_dir.is_dir() or brand_dir.name.startswith("."):
            continue
        brand = brand_dir.name
        brand_slug = slugify(brand)

        for file_path in sorted(brand_dir.iterdir()):
            if not file_path.is_file():
                continue
            if file_path.suffix.lower() not in IMAGE_EXTENSIONS:
                if not (file_path.suffix.lower() == ".webp" and ".jpg" in file_path.stem.lower()):
                    continue
            stem = file_path.stem
            if stem.lower().endswith(".jpg") or stem.lower().endswith(".png"):
                stem = Path(stem).stem
            raw_name = stem
            display_name = to_display_name(raw_name)
            product_slug = slugify(display_name) or slugify(raw_name) or "product"

            full_slug = f"{brand_slug}-{product_slug}"
            if full_slug in seen_slugs:
                continue
            seen_slugs.add(full_slug)

            local_image_key = f"products/{brand_slug}/{product_slug}/01.jpg"
            rows.append({
                "brand": brand,
                "brand_slug": brand_slug,
                "raw_name": raw_name,
                "display_name": display_name,
                "product_slug": product_slug,
                "local_image_key": local_image_key,
                "source": "local-assets",
            })

    out_path = output_dir / "local_assets_catalog.csv"
    headers = ["brand", "brand_slug", "raw_name", "display_name", "product_slug", "local_image_key", "source"]
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=headers)
        w.writeheader()
        w.writerows(rows)

    print(f"Wrote {len(rows)} products to {out_path}")


if __name__ == "__main__":
    main()
