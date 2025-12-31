import os
from typing import List
from pydantic import BaseModel

from crewai import Agent, Task, LLM
from crewai.tools import tool
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer
from toon_format import encode

# =====================================================
# LAZY EMBEDDING MODEL (CRITICAL FIX)
# =====================================================

_embedding_model = None

def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = SentenceTransformer(
            "Qwen/Qwen3-Embedding-0.6B"
        )
    return _embedding_model


# =====================================================
# PINECONE (EXPLICIT, COMPATIBLE INIT)
# =====================================================

pc = Pinecone(
    api_key=os.environ["PINECONE_API_KEY"]
)

icd_10_vector_db = pc.Index("icd10")
hcpcs_vector_db = pc.Index("hcpcs")
cpt_vector_db = pc.Index("cpt")


# =====================================================
# STRUCTURED OUTPUT SCHEMA
# =====================================================

class Structured_Medical_Entities(BaseModel):
    icd_terms: List[str]
    cpt_terms: List[str]
    hcpcs_terms: List[str]


# =====================================================
# MEDICAL ENTITY STRUCTURING AGENT
# =====================================================

input_structuring_agent = Agent(
    role="Medical Entity Structuring Agent",
    goal="Extract ICD-10, CPT-4, and HCPCS Level II relevant terms",
    backstory=(
        "You are a medical documentation analyst trained to identify "
        "diagnostic, procedural, and supply-related entities from clinical text "
        "without making assumptions or adding unsupported information."
    ),
    llm=LLM(model="gemini/gemini-2.5-flash"),
    verbose=True,
    allow_delegation=False,
)


entity_structuring_task = Task(
    description="{medical_report_text}",
    agent=input_structuring_agent,
    output_pydantic=Structured_Medical_Entities,
)


# =====================================================
# VECTOR SEARCH TOOLS (LAZY EMBEDDING USAGE)
# =====================================================

@tool
def ICD_Vector_Search_Tool(terms: List[str]) -> str:
    """Search ICD-10 vector database."""
    results = []
    model = get_embedding_model()

    for term in terms:
        embedding = model.encode(term).tolist()
        res = icd_10_vector_db.query(
            vector=embedding,
            top_k=5,
            include_metadata=True,
        )
        results.append(f"{term}: {encode(res)}")

    return "\n".join(results)


@tool
def HCPCS_Vector_Search_Tool(terms: List[str]) -> str:
    """Search HCPCS Level II vector database."""
    results = []
    model = get_embedding_model()

    for term in terms:
        embedding = model.encode(term).tolist()
        res = hcpcs_vector_db.query(
            vector=embedding,
            top_k=5,
            include_metadata=True,
        )
        results.append(f"{term}: {encode(res)}")

    return "\n".join(results)


@tool
def CPT_Vector_Search_Tool(terms: List[str]) -> str:
    """Search CPT-4 vector database."""
    results = []
    model = get_embedding_model()

    for term in terms:
        embedding = model.encode(term).tolist()
        res = cpt_vector_db.query(
            vector=embedding,
            top_k=5,
            include_metadata=True,
        )
        results.append(f"{term}: {encode(res)}")

    return "\n".join(results)


# =====================================================
# ICD / HCPCS / CPT CODING AGENTS
# =====================================================

icd_coding_agent = Agent(
    role="ICD Coding Agent",
    goal="Assign accurate ICD-10-CM diagnosis codes",
    backstory=(
        "You are a certified medical coder specializing in ICD-10-CM coding. "
        "You strictly rely on provided clinical documentation and retrieved "
        "reference data to select the most accurate diagnosis codes."
    ),
    llm=LLM(model="groq/moonshotai/kimi-k2-instruct-0905"),
    tools=[ICD_Vector_Search_Tool],
    verbose=True,
    allow_delegation=False,
)


icd_task = Task(
    description="Assign ICD-10-CM diagnosis codes",
    agent=icd_coding_agent,
)

hcpcs_coding_agent = Agent(
    role="HCPCS Coding Agent",
    goal="Assign HCPCS Level II codes",
    backstory=(
        "You are a healthcare reimbursement specialist focused on HCPCS Level II "
        "coding. You match supplies and non-physician services strictly to "
        "documented evidence and retrieved references."
    ),
    llm=LLM(model="openrouter/xiaomi/mimo-v2-flash"),
    tools=[HCPCS_Vector_Search_Tool],
    verbose=True,
    allow_delegation=False,
)


hcpcs_task = Task(
    description="Assign HCPCS Level II codes",
    agent=hcpcs_coding_agent,
)


cpt_coding_agent = Agent(
    role="CPT Coding Agent",
    goal="Assign CPT-4 procedure and service codes",
    backstory=(
        "You are a procedural coding expert trained in CPT-4 guidelines. "
        "You assign procedure codes only when the clinical documentation "
        "clearly supports the service performed."
    ),
    llm=LLM(model="groq/openai/gpt-oss-120b"),
    tools=[CPT_Vector_Search_Tool],
    verbose=True,
    allow_delegation=False,
)


cpt_task = Task(
    description="Assign CPT-4 procedure codes",
    agent=cpt_coding_agent,
)
