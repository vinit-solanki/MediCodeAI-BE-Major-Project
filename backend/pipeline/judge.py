from toon_format import encode
from .judge_chain import chain_gemini_3_flash
from dotenv import load_dotenv
load_dotenv(dotenv_path=".env", override=True)

def run_judge(clinical_note: str, coding_output: list):
    result = chain_gemini_3_flash.invoke({
        "clinical_note": clinical_note,
        "medical_coding_output": encode(coding_output)
    })
    return result.model_dump()
