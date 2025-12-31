import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from pipeline.extractor import extract_text_from_pdf
from pipeline.crew_pipeline import run_medical_coding_pipeline
from pipeline.judge import run_judge

# --------------------------------------------------
# ENV + APP
# --------------------------------------------------

load_dotenv()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="MedicodeAI Backend",
    version="1.0.0",
    description="Medical Coding AI – FastAPI Backend",
)

# --------------------------------------------------
# CORS (React compatible)
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# SCHEMAS
# --------------------------------------------------

class ClinicalTextRequest(BaseModel):
    text: str


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok"}


# --------------------------------------------------
# MAIN MEDICAL CODING ENDPOINT
# --------------------------------------------------

@app.post("/api/medical-coding")
async def medical_coding(
    payload: ClinicalTextRequest | None = None,
    file: UploadFile | None = File(default=None),
):
    clinical_text = None

    # ---------- PDF UPLOAD ----------
    if file:
        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files supported")

        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())

        clinical_text = extract_text_from_pdf(file_path)

    # ---------- RAW TEXT ----------
    elif payload:
        clinical_text = payload.text

    if not clinical_text or not clinical_text.strip():
        raise HTTPException(status_code=400, detail="No clinical text provided")

    # --------------------------------------------------
    # RUN PIPELINE (SYNC, CPU/IO BOUND)
    # --------------------------------------------------

    try:
        coding_output = run_medical_coding_pipeline(clinical_text)
        judge_output = run_judge(clinical_text, coding_output)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    return {
        "clinical_text": clinical_text,
        "coding_output": coding_output,
        "judge_output": judge_output,
    }