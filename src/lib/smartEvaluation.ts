import { z } from "zod";

/** Una dimensión SMART con puntuación en [0, 1] y explicación en una línea (español, neutral). */
export interface SmartCriterionScore {
  score: number;
  explanation: string;
}

/** Resultado completo de evaluateSmart. */
export interface SmartEvaluation {
  S: SmartCriterionScore;
  M: SmartCriterionScore;
  A: SmartCriterionScore;
  R: SmartCriterionScore;
  T: SmartCriterionScore;
}

const criterionSchema = z.object({
  score: z.number(),
  explanation: z.string(),
});

const smartEvaluationSchema = z.object({
  S: criterionSchema,
  M: criterionSchema,
  A: criterionSchema,
  R: criterionSchema,
  T: criterionSchema,
});

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function oneLine(s: string): string {
  return s.replace(/\s+/g, " ").trim().slice(0, 220);
}

function normalizeEvaluation(raw: SmartEvaluation): SmartEvaluation {
  const keys = ["S", "M", "A", "R", "T"] as const;
  const out = { ...raw };
  for (const k of keys) {
    out[k] = {
      score: clamp01(raw[k].score),
      explanation: oneLine(raw[k].explanation) || "Sin detalle adicional en este fragmento.",
    };
  }
  return out;
}

const UNCERTAIN_A: SmartCriterionScore = {
  score: 0.5,
  explanation:
    "El fragmento no incluye costos ni fuentes de financiación; la viabilidad no puede calificarse con certeza aquí.",
};

function emptyEvaluation(msg: string): SmartEvaluation {
  const line = oneLine(msg);
  const z = { score: 0, explanation: line };
  return normalizeEvaluation({
    S: z,
    M: z,
    A: z,
    R: z,
    T: z,
  });
}

/**
 * Evalúa una propuesta con criterios SMART (solo el texto aportado; sin inventar datos externos).
 * Si existe `VITE_OPENAI_API_KEY`, usa el modelo configurado vía API OpenAI compatible.
 * Si no, aplica un análisis lingüístico neutro sobre el mismo texto (sin afirmar hechos no presentes).
 */
export async function evaluateSmart(proposalText: string): Promise<SmartEvaluation> {
  const trimmed = proposalText?.trim() ?? "";
  if (!trimmed) {
    return emptyEvaluation("No hay texto de propuesta para evaluar.");
  }

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (apiKey) {
    try {
      const llm = await evaluateSmartWithOpenAI(trimmed, apiKey);
      if (llm) return normalizeEvaluation(llm);
    } catch {
      /* cae al heurístico */
    }
  }

  return normalizeEvaluation(evaluateSmartHeuristic(trimmed));
}

async function evaluateSmartWithOpenAI(
  proposalText: string,
  apiKey: string
): Promise<SmartEvaluation | null> {
  const baseUrl =
    import.meta.env.VITE_OPENAI_BASE_URL?.replace(/\/$/, "") ?? "https://api.openai.com/v1";
  const model = import.meta.env.VITE_OPENAI_MODEL ?? "gpt-4o-mini";

  const system = `Eres un asistente académico neutral. Evalúa SOLO el texto de la propuesta que recibes.
No inventes cifras, programas ni compromisos que no aparezcan en el texto.
Para cada criterio SMART devuelve score entre 0 y 1 y explanation: una sola línea en español, sin sesgo político.
Criterios:
S (Específica): ¿define claramente qué se hará?
M (Medible): ¿hay métricas o resultados observables en el texto?
A (Alcanzable): ¿el texto permite juzgar realismo acotado (sin inventar presupuesto)?
R (Relevante): ¿aborda un problema público claro en el fragmento?
T (Temporal): ¿menciona plazos o horizontes temporales?
Si algo es ambiguo, dilo en explanation y usa score moderado.
Responde únicamente con un objeto JSON con claves S, M, A, R, T; cada una con score y explanation.`;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `Texto de la propuesta:\n\n${proposalText}`,
        },
      ],
    }),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }

  const safe = smartEvaluationSchema.safeParse(parsed);
  if (!safe.success) return null;
  return safe.data;
}

function evaluateSmartHeuristic(text: string): SmartEvaluation {
  const lower = text.toLowerCase();

  const hasDigits = /\d/.test(text);
  const hasPercentOrPib = /%|pib|millones|mil millones|billones/i.test(text);
  const concreteNouns =
    /programa|plan nacional|proyecto|ley|decreto|beca|escuela|docente|currículo|infraestructura|internet/i.test(
      text
    );
  const vague =
    /^(mejorar|fortalecer|impulsar|promover)\b/i.test(lower.trim()) && text.length < 55;

  let sScore = 0.55;
  let sExpl =
    "El fragmento mezcla formulaciones generales y algo de sustancia; el alcance operativo queda parcialmente definido.";
  if (concreteNouns && (hasDigits || /convocatoria|metas|indicador/i.test(text))) {
    sScore = 0.78;
    sExpl =
      "Se nombran instrumentos o líneas de acción relativamente acotadas, lo que precisa en parte qué se haría.";
  } else if (vague && !hasDigits) {
    sScore = 0.38;
    sExpl =
      "Predominan verbos genéricos y el extracto no detalla acciones o instrumentos concretos.";
  }

  let mScore = 0.42;
  let mExpl =
    "No aparecen metas numéricas claras en este fragmento; la medibilidad queda limitada.";
  if (hasPercentOrPib || /meta de|indicador|%\s*del|nivel de cobertura/i.test(text)) {
    mScore = 0.82;
    mExpl = "El texto alude a magnitudes, metas o proporciones que permiten seguimiento observable.";
  } else if (hasDigits) {
    mScore = 0.62;
    mExpl = "Hay cifras o plazos numéricos, aunque no siempre constituyen indicadores de resultado completos.";
  }

  const aScore = UNCERTAIN_A.score;
  const aExpl = UNCERTAIN_A.explanation;

  const eduHints =
    /educaci|escuela|universidad|docente|currículo|estudiante|alumn|formación|alfabet/i.test(
      text
    );
  let rScore = 0.52;
  let rExpl =
    "El fragmento se orienta a política pública, pero el encaje temático exacto no está totalmente explicitado aquí.";
  if (eduHints) {
    rScore = 0.74;
    rExpl = "El texto se centra en un ámbito público reconocible (p. ej. educación) en este extracto.";
  }

  let tScore = 0.4;
  let tExpl = "No se identifican plazos o horizontes temporales explícitos en este fragmento.";
  if (
    /\b(20[2-3]\d)\b/.test(text) ||
    /\d+\s*(años?|meses?|semestres?)/i.test(text) ||
    /plazo|cronograma|cuatrienio|cuatrimestre|al\s+final\s+del\s+periodo/i.test(lower)
  ) {
    tScore = 0.8;
    tExpl = "Se mencionan fechas, duraciones u horizontes que permiten anclar la propuesta en el tiempo.";
  } else if (/gradual|etapa|fase|corto\s+plazo|mediano\s+plazo/i.test(lower)) {
    tScore = 0.58;
    tExpl = "Hay referencias vagas a etapas o plazos sin fechas concretas en el texto.";
  }

  return {
    S: { score: sScore, explanation: sExpl },
    M: { score: mScore, explanation: mExpl },
    A: { score: aScore, explanation: aExpl },
    R: { score: rScore, explanation: rExpl },
    T: { score: tScore, explanation: tExpl },
  };
}

/** Construye el objeto de respuesta por propuesta (p. ej. API o logging), sin alterar el resto del pipeline. */
export function buildProposalWithSmart(args: {
  candidate: string;
  proposal: string;
  topic: string;
  smart_evaluation: SmartEvaluation;
}) {
  return {
    candidate: args.candidate,
    proposal: args.proposal,
    topic: args.topic,
    smart_evaluation: args.smart_evaluation,
  };
}
