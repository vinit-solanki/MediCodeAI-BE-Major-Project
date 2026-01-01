import uuid, datetime
from crewai import Crew
from app.config import langfuse
from app.agents.entity_agent import build_entity_agent
from app.agents.icd_agent import build_icd_agent
from app.agents.cpt_agent import build_cpt_agent
from app.agents.hcpcs_agent import build_hcpcs_agent
from app.agents.judge_agent import run_judge

def run_medical_coding_pipeline(clinical_text: str) -> dict:
    trace_id = langfuse.create_trace_id(seed=f"req-{uuid.uuid4()}")

    entity_agent, entity_task = build_entity_agent()
    icd_agent, icd_task = build_icd_agent()
    cpt_agent, cpt_task = build_cpt_agent()
    hcpcs_agent, hcpcs_task = build_hcpcs_agent()

    crew = Crew(
        agents=[entity_agent, icd_agent, hcpcs_agent, cpt_agent],
        tasks=[entity_task, icd_task, hcpcs_task, cpt_task],
        verbose=False
    )

    with langfuse.start_as_current_observation(
        name="MEDICAL CODING PIPELINE",
        trace_context={"trace_id": trace_id}
    ):
        output = crew.kickoff(
            inputs={"medical_report_text": clinical_text}
        )

    results = [t.pydantic.dict() for t in output.tasks_output if t.pydantic]

    judge_result = run_judge(clinical_text, results, trace_id)

    return {
        "trace_id": trace_id,
        "coding": results,
        "judge": judge_result
    }
