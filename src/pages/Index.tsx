import { useState, useEffect, useMemo } from "react";
import { candidates, type CandidateId } from "@/data/candidates";
import { cn } from "@/lib/utils";
import { evaluateSmart, type SmartEvaluation } from "@/lib/smartEvaluation";
import { SmartEvaluationBlock } from "@/components/SmartEvaluationBlock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Send,
  Sparkles,
  GraduationCap,
  Coins,
  Shield,
  HeartPulse,
  Leaf,
  ScrollText,
  BookOpen,
  ArrowUpRight,
  Plus,
} from "lucide-react";

const categories = [
  { id: "economia", label: "Economía", icon: Coins },
  { id: "educacion", label: "Educación", icon: GraduationCap },
  { id: "salud", label: "Salud", icon: HeartPulse },
  { id: "seguridad", label: "Seguridad", icon: Shield },
  { id: "ambiente", label: "Medio ambiente", icon: Leaf },
] as const;

const suggestions = [
  "Compara las propuestas en educación",
  "¿Qué propone Sergio sobre seguridad?",
  "Diferencias entre Iván y Abelardo en economía",
  "Resumen de propuestas en salud",
];

type SmartEntry = { status: "loading" } | { status: "done"; data: SmartEvaluation };

const Index = () => {
  const [selected, setSelected] = useState<CandidateId[]>(["palo", "ivan", "abelardo"]);
  const [activeCategory, setActiveCategory] = useState<string>("educacion");
  const [showAnswer, setShowAnswer] = useState(true);
  const [input, setInput] = useState("Compara las propuestas en educación");
  const [smartByProposal, setSmartByProposal] = useState<Record<string, SmartEntry>>({});

  const topicLabel = useMemo(
    () => categories.find((c) => c.id === activeCategory)?.label ?? activeCategory,
    [activeCategory]
  );

  const toggleCandidate = (id: CandidateId) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const activeCandidates = candidates.filter((c) => selected.includes(c.id));

  useEffect(() => {
    if (!showAnswer) {
      setSmartByProposal({});
      return;
    }
    let cancelled = false;
    const act = candidates.filter((c) => selected.includes(c.id));
    const pairs = act.flatMap((c) =>
      educationBullets[c.id].map((proposal, i) => ({
        key: `${c.id}-${i}`,
        proposal,
      }))
    );
    setSmartByProposal(
      Object.fromEntries(pairs.map((p) => [p.key, { status: "loading" as const }]))
    );
    pairs.forEach(({ key, proposal }) => {
      void evaluateSmart(proposal).then((data) => {
        if (!cancelled) {
          setSmartByProposal((prev) => ({ ...prev, [key]: { status: "done", data } }));
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, [showAnswer, selected]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ScrollText className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-xl leading-none">Comparador de Propuestas</h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Análisis neutral · Elecciones 2026
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 font-normal">
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--candidate-ivan))]" />
              Modo investigación
            </Badge>
            <Button variant="ghost" size="sm" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Fuentes
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] grid-cols-12 gap-6 px-6 py-6">
        {/* SIDEBAR */}
        <aside className="col-span-3 space-y-6">
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Candidatos
              </h2>
              <span className="text-xs text-muted-foreground">{selected.length}/5</span>
            </div>
            <ul className="space-y-1.5">
              {candidates.map((c) => {
                const isOn = selected.includes(c.id);
                return (
                  <li key={c.id}>
                    <label
                      className={cn(
                        "group flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 transition-colors",
                        isOn
                          ? "border-foreground/15 bg-secondary/70"
                          : "border-transparent hover:bg-secondary/50"
                      )}
                    >
                      <Checkbox
                        checked={isOn}
                        onCheckedChange={() => toggleCandidate(c.id)}
                        className="shrink-0"
                      />
                      <img
                        src={c.foto}
                        alt={`Retrato de ${c.nombre}`}
                        loading="lazy"
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full object-cover ring-2"
                        style={{ ['--tw-ring-color' as any]: `hsl(var(${c.colorVar}) / 0.6)` }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium leading-tight">{c.nombre}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.siglas} · {c.partido}
                        </p>
                      </div>
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: `hsl(var(${c.colorVar}))` }}
                      />
                    </label>
                  </li>
                );
              })}
            </ul>
            <Button variant="outline" size="sm" className="mt-3 w-full gap-2">
              <Plus className="h-3.5 w-3.5" /> Comparar candidatos
            </Button>
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              Categorías
            </h2>
            <ul className="space-y-1">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const active = activeCategory === cat.id;
                return (
                  <li key={cat.id}>
                    <button
                      onClick={() => setActiveCategory(cat.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground/80 hover:bg-secondary"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {cat.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-xl border border-dashed border-border bg-secondary/40 p-4">
            <div className="mb-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Fuentes / Transparencia</h3>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Las respuestas se basan en los planes de gobierno oficiales publicados por cada candidatura. Cada cita incluye su referencia.
            </p>
            <button className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline">
              Ver metodología <ArrowUpRight className="h-3 w-3" />
            </button>
          </section>
        </aside>

        {/* CHAT MAIN */}
        <main className="col-span-9 flex min-h-[calc(100vh-7rem)] flex-col rounded-xl border border-border bg-card">
          {/* Chat header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="text-2xl">Asistente de Análisis</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Comparando {activeCandidates.length} candidatos · Tema:{" "}
                <span className="font-medium text-foreground">
                  {categories.find((c) => c.id === activeCategory)?.label}
                </span>
              </p>
            </div>
            <div className="flex -space-x-2">
              {activeCandidates.map((c) => (
                <img
                  key={c.id}
                  src={c.foto}
                  alt={c.nombre}
                  loading="lazy"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full border-2 border-card object-cover"
                />
              ))}
            </div>
          </div>

          {/* Conversation */}
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            {!showAnswer ? (
              <EmptyState onPick={(q) => { setInput(q); setShowAnswer(true); }} />
            ) : (
              <>
                {/* User message */}
                <div className="flex justify-end">
                  <div className="max-w-[78%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm text-primary-foreground">
                    Compara las propuestas en educación
                  </div>
                </div>

                {/* AI message */}
                <div className="flex gap-3">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <Sparkles className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-5">
                    <div>
                      <p className="text-sm leading-relaxed text-foreground">
                        Aquí tienes una comparación neutral de las propuestas en{" "}
                        <span className="font-semibold">educación</span> de los candidatos seleccionados, según sus planes oficiales:
                      </p>
                    </div>

                    {/* Per-candidate bullets */}
                    <div className="grid gap-3">
                      {activeCandidates.map((c) => (
                        <article
                          key={c.id}
                          className="rounded-lg border border-border bg-background/60 p-4"
                          style={{
                            borderLeft: `3px solid hsl(var(${c.colorVar}))`,
                          }}
                        >
                          <header className="mb-2 flex items-center gap-2.5">
                            <img
                              src={c.foto}
                              alt={c.nombre}
                              loading="lazy"
                              width={28}
                              height={28}
                              className="h-7 w-7 rounded-full object-cover"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold leading-tight">{c.nombre}</p>
                              <p className="text-xs text-muted-foreground">{c.partido}</p>
                              <p className="mt-0.5 text-[10px] text-muted-foreground">Eje: {topicLabel}</p>
                            </div>
                          </header>
                          <div className="space-y-3">
                            {educationBullets[c.id].map((b, i) => {
                              const smartKey = `${c.id}-${i}`;
                              return (
                                <div key={i} className="border-l-2 border-border/60 pl-3">
                                  <p className="text-sm text-foreground/85">{b}</p>
                                  <SmartEvaluationBlock entry={smartByProposal[smartKey]} />
                                </div>
                              );
                            })}
                          </div>
                        </article>
                      ))}
                    </div>

                    {/* Comparison table */}
                    <div className="overflow-hidden rounded-lg border border-border">
                      <div className="border-b border-border bg-secondary/50 px-4 py-2.5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Tabla comparativa · diferencias clave
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                              <th className="px-4 py-2.5 font-medium">Eje</th>
                              {activeCandidates.map((c) => (
                                <th key={c.id} className="px-4 py-2.5 font-medium">
                                  <span className="flex items-center gap-1.5">
                                    <span
                                      className="h-2 w-2 rounded-full"
                                      style={{ backgroundColor: `hsl(var(${c.colorVar}))` }}
                                    />
                                    {c.nombre.split(" ")[0]}
                                  </span>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {comparisonRows.map((row) => (
                              <tr key={row.eje} className="border-b border-border last:border-0">
                                <td className="px-4 py-3 font-medium text-foreground/90">{row.eje}</td>
                                {activeCandidates.map((c) => (
                                  <td key={c.id} className="px-4 py-3 text-foreground/75">
                                    {row.values[c.id] ?? "—"}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Fuentes: Planes de gobierno oficiales registrados ante la autoridad electoral. Última actualización: marzo 2026.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Suggestions + Input */}
          <div className="border-t border-border px-6 py-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); setShowAnswer(true); }}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:border-foreground/30 hover:bg-secondary"
                >
                  {s}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); setShowAnswer(true); }}
              className="flex items-end gap-2 rounded-xl border border-border bg-background p-2 focus-within:border-foreground/30"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={1}
                placeholder="Haz una pregunta sobre los planes de gobierno…"
                className="flex-1 resize-none bg-transparent px-2 py-2 text-sm placeholder:text-muted-foreground focus:outline-none"
              />
              <Button type="submit" size="sm" className="gap-1.5">
                <Send className="h-3.5 w-3.5" />
                Enviar
              </Button>
            </form>
            <p className="mt-2 text-[11px] text-muted-foreground">
              El asistente presenta información de manera neutral y cita fuentes verificables. No emite opiniones.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

const EmptyState = ({ onPick }: { onPick: (q: string) => void }) => (
  <div className="flex h-full flex-col items-center justify-center py-16 text-center">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
      <Sparkles className="h-6 w-6 text-foreground" />
    </div>
    <h3 className="text-2xl">Haz una pregunta sobre los planes de gobierno…</h3>
    <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
      Selecciona uno o varios candidatos en el panel izquierdo y formula tu consulta. Las respuestas se basan en documentos oficiales.
    </p>
    <div className="mt-6 grid max-w-xl grid-cols-2 gap-2">
      {suggestions.map((s) => (
        <button
          key={s}
          onClick={() => onPick(s)}
          className="rounded-lg border border-border bg-background p-3 text-left text-sm text-foreground/80 hover:border-foreground/30 hover:bg-secondary"
        >
          {s}
        </button>
      ))}
    </div>
  </div>
);

const educationBullets: Record<CandidateId, string[]> = {
  palo: [
    "Aumento gradual del presupuesto educativo al 6% del PIB en 4 años.",
    "Evaluación docente por desempeño con incentivos salariales.",
    "Becas competitivas para educación técnica y universitaria.",
  ],
  abelardo: [
    "Educación pública gratuita en todos los niveles, incluido superior.",
    "Programa nacional de alimentación escolar universal.",
    "Contratación masiva de docentes en zonas rurales.",
  ],
  sergio: [
    "Modelo mixto público-privado con bonos educativos por familia.",
    "Inversión prioritaria en infraestructura escolar urbana.",
    "Convenios con municipios para gestión descentralizada.",
  ],
  ivan: [
    "Currículo nacional con énfasis en ciencia, ética y sostenibilidad.",
    "Internet gratuito en todas las escuelas públicas en 3 años.",
    "Formación docente continua certificada por universidades públicas.",
  ],
  lucia: [
    "Alianzas público-privadas para innovación educativa y EdTech.",
    "Reforma curricular orientada a habilidades digitales y emprendimiento.",
    "Sistema de créditos transferibles entre instituciones.",
  ],
};

const comparisonRows: { eje: string; values: Partial<Record<CandidateId, string>> }[] = [
  {
    eje: "Modelo de gestión",
    values: {
      palo: "Mixto, con autonomía",
      abelardo: "Estatal centralizado",
      sergio: "Descentralizado municipal",
      ivan: "Estatal con autonomía",
      lucia: "Mixto público-privado",
    },
  },
  {
    eje: "Inversión proyectada",
    values: {
      palo: "6% del PIB",
      abelardo: "7% del PIB",
      sergio: "5% del PIB",
      ivan: "6,5% del PIB",
      lucia: "5,5% del PIB",
    },
  },
  {
    eje: "Énfasis curricular",
    values: {
      palo: "Técnico-productivo",
      abelardo: "Universal e inclusivo",
      sergio: "Cívico y vocacional",
      ivan: "Ciencia y ambiente",
      lucia: "Digital y emprendedor",
    },
  },
];

export default Index;
