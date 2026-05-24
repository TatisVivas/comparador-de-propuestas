import type { CandidateId } from "@/data/candidates";

/**
 * Sin `VITE_API_URL`: en desarrollo el proxy de Vite (`/api` → :8000) evita CORS.
 * En build de producción define `VITE_API_URL` con la URL pública del API.
 */
function queryUrl(): string {
  const base = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, "");
  if (base) return `${base}/query`;
  if (import.meta.env.DEV) return "/api/query";
  // Producción monolito (mismo host sirve UI + API): mismo origen
  return "/query";
}

export type RagProposal = { candidate: string; text: string };

export type RagQueryResponse = {
  answer: string;
  proposals: RagProposal[];
};

export async function queryRag(params: {
  question: string;
  candidateIds: CandidateId[];
  category: string | null;
}): Promise<RagQueryResponse> {
  const body: Record<string, unknown> = {
    question: params.question.trim(),
  };
  if (params.candidateIds.length > 0) {
    body.candidate_ids = params.candidateIds;
  }
  if (params.category && params.category !== "all") {
    body.category = params.category;
  }

  let res: Response;
  try {
    res = await fetch(queryUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const hint =
      import.meta.env.DEV && !import.meta.env.VITE_API_URL
        ? " ¿Arrancaste el API? En otra terminal: npm run dev:backend"
        : "";
    throw new Error(
      e instanceof Error ? `${e.message}.${hint}` : `Fallo de red al llamar al servidor.${hint}`
    );
  }

  if (!res.ok) {
    const raw = await res.text();
    let detail = `Error ${res.status}`;
    try {
      const j = JSON.parse(raw) as { detail?: unknown };
      if (j.detail !== undefined) {
        detail = typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail);
      }
    } catch {
      if (raw) detail = raw.slice(0, 300);
    }
    throw new Error(detail);
  }

  return res.json() as Promise<RagQueryResponse>;
}
