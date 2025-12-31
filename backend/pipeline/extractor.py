# pipeline/extractor.py
import re
import fitz
import pytesseract
from PIL import Image

def extract_text_from_pdf(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    pages_text = []

    for page in doc:
        text = page.get_text("text")

        if not text.strip():
            pix = page.get_pixmap()
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            text = pytesseract.image_to_string(img, lang="eng")

        text = re.sub(r"[^\x20-\x7E\n\r\t]", "", text)
        pages_text.append(text)

    return "\n".join(pages_text)
