"""
Pipeline RAG: PDFs por candidato (y opcionalmente por categoría) → limpieza → chunks → Chroma → consulta filtrada → Groq.
"""
from __future__ import annotations

import re
import shutil
import threading
from pathlib import Path

import chromadb
import fitz
from groq import Groq
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer

from config import GROQ_API_KEY

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
CHROMA_DIR = BASE_DIR / "chroma_db"

N_RESULTS = 5
GROQ_MODEL = "llama-3.3-70b-versatile"

# Alineado con src/data/candidates.ts
VALID_CANDIDATE_IDS = frozenset({"palo", "abelardo", "sergio", "ivan", "lucia"})

# Alineado con Index.tsx categories
CATEGORY_LABELS = {
    "economia": "Economía",
    "educacion": "Educación",
    "salud": "Salud",
    "seguridad": "Seguridad",
    "ambiente": "Medio ambiente",
    "general": "General",
}

_model: SentenceTransformer | None = None
_coleccion = None
_groq_client: Groq | None = None
_init_lock = threading.Lock()


def is_rag_ready() -> bool:
    return _model is not None and _coleccion is not None and _groq_client is not None


def ensure_rag_index() -> None:
    """Inicializa Chroma + embeddings la primera vez (descarga modelo HF si hace falta). No bloquea el arranque de uvicorn."""
    if is_rag_ready():
        return
    with _init_lock:
        if is_rag_ready():
            return
        init_rag_index()


def limpiar_texto_base(texto: str) -> str:
    texto = re.sub(r"\|\s*\d+\s*\|", "", texto)
    texto = re.sub(r"\n+", "\n", texto)
    texto = re.sub(r"\s+", " ", texto)
    return texto.strip()


def _extract_chunks_from_data_tree(data_dir: Path) -> tuple[list[str], list[dict]]:
    """
    Esperado:
      data/<candidate_id>/<archivo>.pdf
      data/<candidate_id>/<categoria>/<archivo>.pdf   → metadata category = nombre de carpeta
    Solo se indexan carpetas cuyo nombre está en VALID_CANDIDATE_IDS.
    """
    splitter_lc = RecursiveCharacterTextSplitter(
        chunk_size=450,
        chunk_overlap=50,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks: list[str] = []
    metadatas: list[dict] = []

    if not data_dir.is_dir():
        return chunks, metadatas

    for cand_dir in sorted(data_dir.iterdir()):
        if not cand_dir.is_dir():
            continue
        cid = cand_dir.name
        if cid not in VALID_CANDIDATE_IDS:
            continue

        for pdf_path in cand_dir.rglob("*.pdf"):
            rel = pdf_path.relative_to(cand_dir)
            parts = rel.parts
            if len(parts) == 1:
                category = "general"
            else:
                category = parts[0]

            nombre_pdf = pdf_path.name
            doc = fitz.open(pdf_path)
            texto_completo = ""
            for pagina in doc:
                texto_completo += pagina.get_text()
            doc.close()
            texto_completo = limpiar_texto_base(texto_completo)

            parrafos = texto_completo.split("\n\n")
            for p in parrafos:
                p = p.strip()
                if len(p) < 50:
                    continue
                if len(p) > 450:
                    subchunks = splitter_lc.split_text(p)
                    for sc in subchunks:
                        chunks.append(sc)
                        metadatas.append(
                            {
                                "candidate": cid,
                                "category": category,
                                "source": nombre_pdf,
                            }
                        )
                else:
                    chunks.append(p)
                    metadatas.append(
                        {
                            "candidate": cid,
                            "category": category,
                            "source": nombre_pdf,
                        }
                    )

    return chunks, metadatas


def _normalize_candidate_ids(raw: list[str] | None) -> list[str] | None:
    if not raw:
        return None
    out = [x.strip() for x in raw if x.strip() in VALID_CANDIDATE_IDS]
    return out or None


def _chrom_where_clause(
    candidate_ids: list[str] | None,
    category: str | None,
) -> dict | None:
    """Construye filtro Chroma; None = sin filtro en ese eje."""
    cat = category.strip() if category else None
    if cat and cat not in CATEGORY_LABELS:
        cat = None

    conds: list[dict] = []
    if candidate_ids:
        conds.append({"candidate": {"$in": candidate_ids}})
    if cat:
        conds.append({"category": cat})

    if not conds:
        return None
    if len(conds) == 1:
        return conds[0]
    return {"$and": conds}


def init_rag_index() -> None:
    global _model, _coleccion, _groq_client

    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY no está configurada en el entorno.")

    shutil.rmtree(CHROMA_DIR, ignore_errors=True)
    CHROMA_DIR.mkdir(parents=True, exist_ok=True)

    chunks, metadatas = _extract_chunks_from_data_tree(DATA_DIR)
    if not chunks:
        raise RuntimeError(
            f"No hay PDFs indexables en {DATA_DIR}. "
            f"Crea carpetas por id de candidato ({', '.join(sorted(VALID_CANDIDATE_IDS))}) y coloca los .pdf dentro."
        )

    _model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
    cliente = chromadb.PersistentClient(path=str(CHROMA_DIR))
    coleccion = cliente.get_or_create_collection(
        name="pdf_programa_gobierno",
        metadata={"hnsw:space": "cosine"},
    )

    embeddings = _model.encode(chunks, show_progress_bar=False).tolist()
    coleccion.add(
        documents=chunks,
        embeddings=embeddings,
        ids=[f"id_{i}" for i in range(len(chunks))],
        metadatas=metadatas,
    )

    _coleccion = coleccion
    _groq_client = Groq(api_key=GROQ_API_KEY)


def run_rag_pipeline(
    question: str,
    candidate_ids: list[str] | None = None,
    category: str | None = None,
) -> dict:
    ensure_rag_index()

    consulta = question.strip()
    if not consulta:
        return {"answer": "", "proposals": []}

    cand_filter = _normalize_candidate_ids(candidate_ids)
    where = _chrom_where_clause(cand_filter, category)

    kwargs: dict = {
        "query_embeddings": _model.encode([consulta]).tolist(),
        "n_results": N_RESULTS,
        "include": ["documents", "distances", "metadatas"],
    }
    if where is not None:
        kwargs["where"] = where

    try:
        resultados = _coleccion.query(**kwargs)
    except Exception as e:
        raise RuntimeError(
            f"Error en la búsqueda vectorial (Chroma). Revisa filtros y versión de chromadb. Causa: {e}"
        ) from e

    raw_docs = resultados.get("documents") or []
    docs_filtrados = raw_docs[0] if raw_docs else []
    docs_filtrados = [d for d in docs_filtrados if d is not None]
    docs_filtrados = [str(d) for d in docs_filtrados]

    raw_metas = resultados.get("metadatas") or []
    metas = raw_metas[0] if raw_metas else []

    proposals: list[dict] = []
    for i, doc in enumerate(docs_filtrados):
        meta = metas[i] if i < len(metas) and metas[i] else {}
        if not isinstance(meta, dict):
            meta = {}
        proposals.append(
            {
                "candidate": str(meta.get("candidate", "unknown")),
                "category": str(meta.get("category", "general")),
                "source": str(meta.get("source", "")),
                "text": doc,
            }
        )

    scope_lines = []
    if cand_filter:
        scope_lines.append("Candidatos considerados en la búsqueda: " + ", ".join(cand_filter) + ".")
    if category and category.strip() in CATEGORY_LABELS:
        scope_lines.append(
            "Categoría / tema: " + CATEGORY_LABELS.get(category.strip(), category.strip()) + "."
        )

    if not docs_filtrados:
        msg = "No hay contexto suficientemente relevante"
        if cand_filter or (category and category.strip() in CATEGORY_LABELS):
            msg += " con los filtros aplicados."
        return {"answer": msg + ".", "proposals": []}

    fragmentos = "\n\n".join(docs_filtrados)
    max_ctx = 28_000
    if len(fragmentos) > max_ctx:
        fragmentos = fragmentos[:max_ctx] + "\n\n[…fragmentos truncados por límite de contexto]"

    scope_block = ("\n".join(scope_lines) + "\n") if scope_lines else ""

    prompt = f"""Eres un asistente que analiza propuestas políticas en Colombia de forma precisa y neutral.

{scope_block}Responde la consulta usando SOLO los fragmentos recuperados. No inventes información.
 solo realiza una calificacion desde los objetivos SMART para esa propuesta, dandole puntaje a cada letra.
Si la información es insuficiente, responde: "No hay información suficiente."
pero usa todos los fragmentos disponibles (siempre y cuando exista conección lógica con la consulta)

Consulta:
{consulta}

Fragmentos recuperados:
{fragmentos}

Resumen:"""

    try:
        response = _groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
            temperature=0.3,
        )
    except Exception as e:
        raise RuntimeError(
            "No se pudo generar la respuesta con Groq (clave, cuota o modelo). "
            f"Detalle: {type(e).__name__}: {e}"
        ) from e

    answer = ""
    if response.choices:
        answer = response.choices[0].message.content or ""

    proposals_out = [{"candidate": p["candidate"], "text": p["text"]} for p in proposals]

    return {"answer": answer, "proposals": proposals_out}
