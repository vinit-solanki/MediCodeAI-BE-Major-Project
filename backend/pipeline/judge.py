from toon_format import encode
from .judge_chain import chain_gemini_3_flash

def run_judge(clinical_note: str, coding_output: list):
    result = chain_gemini_3_flash.invoke({
        "clinical_note": clinical_note,
        "medical_coding_output": encode(coding_output)
    })
    return result.model_dump()
