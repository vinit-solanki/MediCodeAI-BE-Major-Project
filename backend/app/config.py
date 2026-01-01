import os
from dotenv import load_dotenv
import openlit
from langfuse import Langfuse
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone

load_dotenv()

# ---- Observability ----
langfuse = Langfuse()

openlit.init(
    disabled_instrumentors=[
        "httpx", "requests", "transformers",
        "pinecone", "urllib3", "urllib", "langchain"
    ],
    disable_metrics=True,
    disable_batch=True,
)

# ---- Vector DB ----
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
icd_index = pc.Index("icd10")
cpt_index = pc.Index("cpt")
hcpcs_index = pc.Index("hcpcs")

# ---- Embedding Model (LOADED ONCE) ----
embedding_model = SentenceTransformer("Qwen/Qwen3-Embedding-0.6B")
