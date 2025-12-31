import pipeline.env  # MUST be first import

import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel

from pipeline.extractor import extract_text_from_pdf
from pipeline.crew_pipeline import run_medical_coding_pipeline
from pipeline.judge import run_judge

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="Medical Coding AI Backend")


class ClinicalTextRequest(BaseModel):
    text: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/medical-coding")
async def medical_coding(
    payload: ClinicalTextRequest | None = None,
    file: UploadFile | None = File(default=None),
    report: UploadFile | None = File(default=None),
):
    clinical_text = None

    uploaded_file = file or report

    if uploaded_file:
        if not uploaded_file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")

        file_path = os.path.join(UPLOAD_DIR, uploaded_file.filename)
        with open(file_path, "wb") as f:
            f.write(await uploaded_file.read())

        clinical_text = extract_text_from_pdf(file_path)

    elif payload:
        clinical_text = payload.text

    if not clinical_text or not clinical_text.strip():
        raise HTTPException(status_code=400, detail="No clinical text provided")

    coding_output = run_medical_coding_pipeline(clinical_text)
    judge_output = run_judge(clinical_text, coding_output)

    return {
        "clinical_text": clinical_text,
        "coding_output": coding_output,
        "judge_output": judge_output,
    }
