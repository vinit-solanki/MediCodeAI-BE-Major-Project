from toon_format import encode
from app.config import embedding_model

def vector_search(index, query_terms, compressor):
    results = []

    for term in query_terms:
        emb = embedding_model.encode(term)
        if hasattr(emb, "tolist"):
            emb = emb.tolist()

        resp = index.query(
            vector=emb,
            top_k=5,
            include_metadata=True
        )

        results.append(
            f"Results for '{term}':\n{encode(compressor(resp))}"
        )

    return "\n\n".join(results)
