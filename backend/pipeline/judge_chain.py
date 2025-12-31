from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

class Verdict(str, Enum):
    pass_ = "pass"
    fail = "fail"

class RiskLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

class MedicalCodingJudgeOutput(BaseModel):
    overall_verdict: Verdict
    overall_score: float = Field(..., ge=0, le=1)
    compliance_risk: RiskLevel
    summary: str

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a strict medical coding auditor. Return JSON only."),
    ("human", "Clinical Note:\n{clinical_note}\n\nCoding Output:\n{medical_coding_output}")
])

llm = ChatGoogleGenerativeAI(
    model="gemini-3-flash-preview",
    temperature=0
).with_structured_output(MedicalCodingJudgeOutput)

chain_gemini_3_flash = prompt | llm
