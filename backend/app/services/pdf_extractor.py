import re
import fitz
import pytesseract
from PIL import Image

def extract_text_from_pdf(file_bytes: bytes) -> str:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages = []

    for page in doc:
        text = page.get_text("text")

        if not text.strip():
            pix = page.get_pixmap()
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            text = pytesseract.image_to_string(img, lang="eng")

        text = re.sub(r"[^\x20-\x7E\n\r\t]", "", text)
        pages.append(text)

    return "\n".join(pages)
