from crewai import Crew
from .agents import (
    input_structuring_agent,
    entity_structuring_task,
    icd_coding_agent,
    icd_task,
    hcpcs_coding_agent,
    hcpcs_task,
    cpt_coding_agent,
    cpt_task
)

def run_medical_coding_pipeline(text: str):
    crew = Crew(
        agents=[
            input_structuring_agent,
            icd_coding_agent,
            hcpcs_coding_agent,
            cpt_coding_agent
        ],
        tasks=[
            entity_structuring_task,
            icd_task,
            hcpcs_task,
            cpt_task
        ],
        verbose=False
    )

    output = crew.kickoff(inputs={"medical_report_text": text})

    results = []
    for task in output.tasks_output:
        if task.pydantic:
            # ✅ Pydantic v2 compliant
            results.append(task.pydantic.model_dump())

    return results
