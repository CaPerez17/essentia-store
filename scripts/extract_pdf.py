#!/usr/bin/env python3
"""
Extract perfume products + images from provider PDF price list.
Usage: python3 scripts/extract_pdf.py data/PRECIOS_2026.pdf

PDF layout (columns by x0 coordinate):
  ~118      : Alphabetic index letter (ignore)
  143-350   : NOMBRE (format: MARCA - PRODUCTO)
  361-432   : CANTIDAD (100ML - 3.3 OZ, SET)
  477-516   : GENERO (M, F, X, UNISEX)
  556-630   : PRECIO VENTA ($ 260.000)
  689+      : IMAGEN

Output:
  data/essentia_from_pdf.csv   - product rows
  data/essentia_images/{slug}.jpg - product images extracted from PDF
"""
from __future__ import annotations

import argparse
import csv
import os
import re
import unicodedata
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    print("Install pdfplumber:  pip3 install pdfplumber")
    exit(1)

try:
    import fitz  # PyMuPDF
except ImportError:
    print("Install PyMuPDF:  pip3 install PyMuPDF")
    exit(1)


# ---------------------------------------------------------------------------
# Column boundaries (from PDF layout analysis)
# ---------------------------------------------------------------------------

NAME_X_MIN = 135
NAME_X_MAX = 355
QTY_X_MIN = 355
QTY_X_MAX = 460
GENDER_X_MIN = 460
GENDER_X_MAX = 545
PRICE_X_MIN = 545
PRICE_X_MAX = 650
# Index letter is at x0 < 130 (single letter, ignored)
HEADER_Y_MAX = 165  # Skip header rows above this Y


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def slugify(text):
    if not text:
        return ""
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = re.sub(r"[^\w\s-]", "", text.lower())
    text = re.sub(r"[-\s]+", "-", text).strip("-")
    return text or "product"


def parse_price(raw):
    """Extract integer COP price from strings like '$ 320.000' or '1.200.000'."""
    m = re.search(r"\$?\s*([\d.]+)", raw)
    if not m:
        return None
    cleaned = m.group(1).replace(".", "")
    try:
        val = int(cleaned)
        return val if val >= 10000 else None
    except ValueError:
        return None


def detect_gender(text):
    t = text.strip().upper()
    if t in ("UNISEX", "X"):
        return "unisex"
    if t == "M":
        return "masculine"
    if t == "F":
        return "feminine"
    return ""


def detect_volume(text):
    """Parse quantity column: '100ML - 3.3 OZ' -> '100ml', 'SET' -> 'set'."""
    m = re.search(r"(\d+)\s*ML", text.upper())
    if m:
        return f"{m.group(1)}ml"
    if "SET" in text.upper():
        return "set"
    return ""


def split_brand_name(raw_name):
    """Split 'MARCA - PRODUCTO' into (brand, name)."""
    for sep in (" - ", " – ", " — "):
        if sep in raw_name:
            parts = raw_name.split(sep, 1)
            brand = parts[0].strip()
            name = parts[1].strip()
            if brand and name:
                return brand, name
    # No separator — whole string is name, brand unknown
    return raw_name, raw_name


def words_in_column(row_words, x_min, x_max):
    """Get words whose x0 falls within [x_min, x_max)."""
    return [w for w in row_words if x_min <= w["x0"] < x_max]


# ---------------------------------------------------------------------------
# PDF extraction — column-based approach
# ---------------------------------------------------------------------------

def group_words_into_rows(words, tolerance=8.0):
    """Group words by Y coordinate (top) within tolerance."""
    if not words:
        return []
    sorted_words = sorted(words, key=lambda w: (w["top"], w["x0"]))
    rows = []
    current_row = [sorted_words[0]]
    current_y = sorted_words[0]["top"]

    for w in sorted_words[1:]:
        if abs(w["top"] - current_y) <= tolerance:
            current_row.append(w)
        else:
            rows.append(current_row)
            current_row = [w]
            current_y = w["top"]
    rows.append(current_row)
    return rows


def extract_products_from_page(page):
    """Extract product rows from a single pdfplumber page using column positions."""
    words = page.extract_words(keep_blank_chars=True, x_tolerance=3, y_tolerance=3)
    if not words:
        return []

    rows = group_words_into_rows(words)
    products = []
    pending_name = None  # For multiline product names

    for row_words in rows:
        avg_y = sum(w["top"] for w in row_words) / len(row_words)

        # Skip header area
        if avg_y < HEADER_Y_MAX:
            continue

        # Extract columns
        name_words = words_in_column(row_words, NAME_X_MIN, NAME_X_MAX)
        price_words = words_in_column(row_words, PRICE_X_MIN, PRICE_X_MAX)
        gender_words = words_in_column(row_words, GENDER_X_MIN, GENDER_X_MAX)
        qty_words = words_in_column(row_words, QTY_X_MIN, QTY_X_MAX)

        name_text = " ".join(w["text"] for w in sorted(name_words, key=lambda w: w["x0"])).strip()
        price_text = " ".join(w["text"] for w in price_words).strip()
        gender_text = " ".join(w["text"] for w in gender_words).strip()
        qty_text = " ".join(w["text"] for w in qty_words).strip()

        has_price = bool(price_text and parse_price(price_text))

        if name_text and not has_price:
            # Row has name but no price — this is a multiline name continuation
            # or the first line of a split-name product
            pending_name = name_text
            continue

        if has_price:
            # Complete product row (or second line of a multiline name)
            full_name = name_text
            if pending_name:
                # Merge with previous name-only row
                if name_text:
                    full_name = f"{pending_name} {name_text}"
                else:
                    full_name = pending_name
                pending_name = None
            else:
                pending_name = None

            if not full_name or len(full_name) < 2:
                continue

            price = parse_price(price_text)
            if not price:
                continue

            gender = detect_gender(gender_text)
            volume = detect_volume(qty_text)
            brand, name = split_brand_name(full_name)

            # Build slug
            slug = slugify(f"{brand}-{name}")
            if volume and volume != "set":
                slug = f"{slug}-{volume}"
            elif volume == "set":
                slug = f"{slug}-set"

            products.append({
                "raw_name": full_name,
                "brand": brand.title(),
                "name": name.title(),
                "slug": slug,
                "volume": volume,
                "gender": gender,
                "price": price,
                "row_y": avg_y,
            })
        else:
            # No name, no price — reset pending
            pending_name = None

    return products


def extract_images_from_page(doc_page, page_width):
    """Extract images from a PyMuPDF page, keeping only right-side images (product photos)."""
    images = []
    img_list = doc_page.get_images(full=True)

    for img_info in img_list:
        xref = img_info[0]
        try:
            rects = doc_page.get_image_rects(xref)
            if not rects:
                continue
            rect = rects[0]
            x_center = (rect.x0 + rect.x1) / 2

            # Only images on the right side (>65% of page width) — product photos
            if x_center < page_width * 0.65:
                continue

            y_center = (rect.y0 + rect.y1) / 2
            width = rect.x1 - rect.x0
            height = rect.y1 - rect.y0

            # Skip tiny images (icons, decorations)
            if width < 30 or height < 30:
                continue

            images.append({
                "xref": xref,
                "y_center": y_center,
                "width": width,
                "height": height,
            })
        except Exception:
            continue

    return images


def match_products_to_images(products, images, max_distance=100.0):
    """Assign closest image to each product by Y coordinate."""
    for prod in products:
        prod["image_xref"] = None
        prod["image_distance"] = float("inf")

        for img in images:
            dist = abs(prod["row_y"] - img["y_center"])
            if dist < prod["image_distance"] and dist <= max_distance:
                prod["image_xref"] = img["xref"]
                prod["image_distance"] = dist


def save_image(doc, xref, output_path):
    """Extract image from PDF by xref and save as JPG."""
    try:
        pix = fitz.Pixmap(doc, xref)
        # Convert CMYK or other color spaces to RGB
        if pix.n - pix.alpha > 3:
            pix = fitz.Pixmap(fitz.csRGB, pix)
        pix.save(output_path)
        return True
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Extract products from provider PDF")
    parser.add_argument("pdf_path", help="Path to PDF file")
    parser.add_argument("--output-dir", default="data", help="Output directory")
    args = parser.parse_args()

    pdf_path = args.pdf_path
    if not os.path.exists(pdf_path):
        print(f"Error: PDF not found at {pdf_path}")
        exit(1)

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    images_dir = output_dir / "essentia_images"
    images_dir.mkdir(parents=True, exist_ok=True)

    # Open with both libraries
    plumber_pdf = pdfplumber.open(pdf_path)
    fitz_doc = fitz.open(pdf_path)

    all_products = []
    seen_slugs = {}

    num_pages = len(plumber_pdf.pages)
    print(f"Processing {num_pages} pages from {pdf_path}...\n")

    for page_num in range(num_pages):
        plumber_page = plumber_pdf.pages[page_num]
        fitz_page = fitz_doc[page_num]

        products = extract_products_from_page(plumber_page)
        if not products:
            continue

        page_width = plumber_page.width
        images = extract_images_from_page(fitz_page, page_width)
        match_products_to_images(products, images)

        for prod in products:
            # Handle duplicate slugs
            base_slug = prod["slug"]
            if base_slug in seen_slugs:
                seen_slugs[base_slug] += 1
                prod["slug"] = f"{base_slug}-v{seen_slugs[base_slug]}"
            else:
                seen_slugs[base_slug] = 0

            # Extract image
            has_image = False
            if prod["image_xref"]:
                img_path = str(images_dir / f"{prod['slug']}.jpg")
                has_image = save_image(fitz_doc, prod["image_xref"], img_path)

            prod["has_image"] = has_image
            prod["page"] = page_num + 1
            all_products.append(prod)

        print(f"  Page {page_num + 1}: {len(products)} products, {len(images)} images")

    plumber_pdf.close()
    fitz_doc.close()

    # Write CSV
    csv_path = output_dir / "essentia_from_pdf.csv"
    fieldnames = ["slug", "brand", "name", "volume", "gender", "price", "has_image", "page"]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for p in all_products:
            writer.writerow({k: p[k] for k in fieldnames})

    # Summary
    with_img = sum(1 for p in all_products if p["has_image"])
    without_img = len(all_products) - with_img
    brands = len(set(p["brand"] for p in all_products))

    print(f"\n=== Resumen ===")
    print(f"Total productos: {len(all_products)}")
    print(f"Marcas únicas:   {brands}")
    print(f"Con imagen:      {with_img}")
    print(f"Sin imagen:      {without_img}")
    print(f"CSV:             {csv_path}")
    print(f"Imágenes:        {images_dir}/")


if __name__ == "__main__":
    main()
