# Comparador de Propuestas

Herramienta web para consultar y comparar propuestas de campaña presidencial en Colombia (Elecciones 2026). Usa **RAG** (Retrieval-Augmented Generation) sobre los programas de gobierno en PDF y responde preguntas en lenguaje natural con un enfoque neutral.

## Características

- Consultas en lenguaje natural sobre propuestas de hasta 5 candidatos
- Filtros por candidato y categoría (economía, educación, salud, seguridad, medio ambiente)
- Respuestas generadas con contexto recuperado de los PDFs oficiales
- Evaluación **SMART** (Específico, Medible, Alcanzable, Temporal) de los fragmentos recuperados
- Interfaz responsive con React, Tailwind CSS y shadcn/ui

## Candidatos incluidos

| ID | Candidato | Partido |
|---|---|---|
| `palo` | Paloma Valencia | Centro Democrático |
| `abelardo` | Abelardo de la Espriella | Defensores de la Patria |
| `sergio` | Sergio Fajardo | Dignidad y Compromiso |
| `ivan` | Iván Cepeda Castro | Pacto Histórico |
| `lucia` | Claudia López | Imparables |

## Arquitectura

```
┌─────────────────┐     POST /query      ┌──────────────────────────────┐
│  Frontend       │ ───────────────────► │  Backend (FastAPI)           │
│  React + Vite   │                      │  RAG: Chroma + SentenceTrans.│
│  :8080          │ ◄─────────────────── │  LLM: Groq (llama-3.3-70b)   │
└─────────────────┘     JSON             └──────────────────────────────┘
                                                    │
                                                    ▼
                                         backend/data/<candidato>/*.pdf
```

1. Los PDFs se indexan en **ChromaDB** con embeddings multilingües (`paraphrase-multilingual-MiniLM-L12-v2`).
2. Cada consulta recupera los fragmentos más relevantes (filtrados por candidato y categoría).
3. **Groq** genera una respuesta basada únicamente en esos fragmentos.
4. El frontend evalúa localmente los criterios SMART del texto recuperado.

## Requisitos

- **Node.js** 18+ y npm
- **Python** 3.11+
- Clave de API de [Groq](https://console.groq.com/)

## Instalación

### 1. Clonar e instalar dependencias del frontend

```bash
git clone <url-del-repo>
cd comparador-de-propuestas
npm install
```

### 2. Configurar el backend

```bash
cd backend
cp .env.example .env
```

Edita `backend/.env` y agrega tu clave:

```env
GROQ_API_KEY=tu_clave_aqui
```

Instala las dependencias de Python:

```bash
npm run backend:install
```

### 3. Documentos fuente (PDFs)

Coloca los programas de gobierno en `backend/data/` con esta estructura:

```
backend/data/
├── palo/
│   └── Programa Integrado de Gobierno.pdf
├── abelardo/
│   └── programa-de-gobierno-abelardo.pdf
├── sergio/
│   └── Programa de gobierno.pdf
├── ivan/
│   └── programa-gobierno-2026-2030.pdf
└── lucia/
    └── Programa-Gobierno-Claudia-Lopez.pdf
```

Opcionalmente puedes organizar PDFs por categoría:

```
backend/data/sergio/educacion/capitulo-educacion.pdf
```

Los IDs de carpeta deben coincidir con los definidos en `src/data/candidates.ts`.

## Desarrollo local

Arranca el backend y el frontend en **terminales separadas**:

```bash
# Terminal 1 — API en http://127.0.0.1:8000
npm run dev:backend

# Terminal 2 — UI en http://localhost:8080
npm run dev
```

En desarrollo, Vite hace proxy de `/api` hacia el backend para evitar problemas de CORS.

> **Nota:** La primera consulta puede tardar varios minutos mientras se descarga el modelo de embeddings y se indexan los PDFs.

## Producción (monolito)

El backend puede servir el frontend compilado desde la misma URL:

```bash
npm run build
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

La app quedará disponible en `http://localhost:8000`. No hace falta definir `VITE_API_URL` en este modo.

Para desplegar frontend y API por separado, define `VITE_API_URL` con la URL pública del backend antes de `npm run build`.

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo del frontend (puerto 8080) |
| `npm run dev:backend` | API FastAPI con recarga automática (puerto 8000) |
| `npm run backend:install` | Instala dependencias Python |
| `npm run build` | Compila el frontend en `dist/` |
| `npm run preview` | Previsualiza el build de producción |
| `npm run test` | Ejecuta tests con Vitest |
| `npm run lint` | Linter con ESLint |

## API

### `GET /health`

Indica si el índice RAG está listo.

### `POST /query`

```json
{
  "question": "¿Qué propone Sergio sobre educación?",
  "candidate_ids": ["sergio", "ivan"],
  "category": "educacion"
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `question` | string | Pregunta del usuario (obligatorio) |
| `candidate_ids` | string[] \| null | IDs de candidatos; vacío = todos |
| `category` | string \| null | `economia`, `educacion`, `salud`, `seguridad`, `ambiente` |

**Respuesta:**

```json
{
  "answer": "Resumen generado por el LLM...",
  "proposals": [
    { "candidate": "sergio", "text": "Fragmento del PDF..." }
  ]
}
```

## Estructura del proyecto

```
comparador-de-propuestas/
├── src/                    # Frontend React + TypeScript
│   ├── pages/Index.tsx     # Página principal del comparador
│   ├── data/candidates.ts  # Metadatos de candidatos
│   └── lib/
│       ├── ragApi.ts       # Cliente HTTP del backend
│       └── smartEvaluation.ts
├── backend/
│   ├── main.py             # Endpoints FastAPI
│   ├── rag.py              # Pipeline RAG (indexación + consulta)
│   ├── config.py           # Variables de entorno
│   ├── data/               # PDFs por candidato
│   └── chroma_db/          # Índice vectorial (generado)
├── public/
└── dist/                   # Build de producción (generado)
```

## Stack tecnológico

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Query, Zod

**Backend:** FastAPI, ChromaDB, Sentence Transformers, PyMuPDF, Groq API, LangChain Text Splitters

## Aviso

Esta herramienta es de carácter informativo y de investigación. Las respuestas se basan en fragmentos recuperados de los documentos indexados y pueden no reflejar el programa completo de cada candidato. Verifica siempre las fuentes originales.
