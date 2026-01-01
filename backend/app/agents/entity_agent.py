from crewai import Agent, Task
from pydantic import BaseModel, Field
from typing import List
from crewai import LLM

class StructuredMedicalEntities(BaseModel):
    icd_terms: List[str]
    cpt_terms: List[str]
    hcpcs_terms: List[str]

def build_entity_agent(llm: LLM):
    agent = Agent(
        role="Medical Entity Structuring Agent",
        goal="Convert raw clinical text into coding-ready entities",
        llm=llm,
        allow_delegation=False,
        verbose=True
    )

    task = Task(
        description="{medical_report_text}",
        agent=agent,
        output_pydantic=StructuredMedicalEntities
    )

    return agent, task
