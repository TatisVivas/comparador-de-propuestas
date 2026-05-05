from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from rag import is_rag_ready, run_rag_pipeline

# Raíz del repo: backend/main.py -> parent.parent
DIST_DIR = Path(__file__).resolve().parent.parent / "dist"
SERVE_SPA = DIST_DIR.is_dir() and (DIST_DIR / "index.html").is_file()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # El índice y la descarga desde Hugging Face ocurren en la primera consulta (no bloquea el puerto 8000).
    yield


app = FastAPI(
    title="Comparador RAG",
    lifespan=lifespan,
    docs_url=None if SERVE_SPA else "/docs",
    redoc_url=None if SERVE_SPA else "/redoc",
    openapi_url=None if SERVE_SPA else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ready" if is_rag_ready() else "loading"}


class QueryRequest(BaseModel):
    question: str = Field(..., min_length=1)
    candidate_ids: list[str] | None = None
    """Vacío o null = todos los candidatos con datos en el índice."""
    category: str | None = None
    """Id de categoría (economia, educacion, …) o null = sin filtro por categoría."""


class Proposal(BaseModel):
    candidate: str
    text: str


class QueryResponse(BaseModel):
    answer: str
    proposals: list[Proposal]


@app.post("/query", response_model=QueryResponse)
def query(req: QueryRequest):
    try:
        data = run_rag_pipeline(
            req.question,
            candidate_ids=req.candidate_ids,
            category=req.category,
        )
        return data
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except Exception as e:
        # Groq, Chroma u otros errores no envueltos → detalle visible para depuración
        raise HTTPException(
            status_code=502,
            detail=f"{type(e).__name__}: {e}",
        ) from e


if SERVE_SPA:
    assets_dir = DIST_DIR / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    def spa_index():
        return FileResponse(DIST_DIR / "index.html")

    @app.get("/{full_path:path}")
    def spa_fallback(full_path: str):
        candidate = DIST_DIR / full_path
        if candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(DIST_DIR / "index.html")
