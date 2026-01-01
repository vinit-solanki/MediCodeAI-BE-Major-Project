from fastapi import APIRouter, UploadFile, File
from app.crew.medical_coding_crew import run_medical_coding_pipeline
from app.services.pdf_extractor import extract_text_from_pdf

router = APIRouter()

@router.post("/medical-coding/text")
async def medical_coding_text(payload: dict):
    return run_medical_coding_pipeline(payload["clinical_text"])

@router.post("/medical-coding/pdf")
async def medical_coding_pdf(file: UploadFile = File(...)):
    text = extract_text_from_pdf(await file.read())
    return run_medical_coding_pipeline(text)
