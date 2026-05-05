import { useState, useEffect, useMemo, type CSSProperties } from "react";
import { candidates, type CandidateId } from "@/data/candidates";
import { cn } from "@/lib/utils";
import { queryRag } from "@/lib/ragApi";
import { evaluateSmart, type SmartEvaluation } from "@/lib/smartEvaluation";
import { SmartEvaluationBlock } from "@/components/SmartEvaluationBlock";
import { PlatformHowToDialog } from "@/components/PlatformHowToDialog";
import { SourcesDialog } from "@/components/SourcesDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Send,
  Sparkles,
  GraduationCap,
  Coins,
  Shield,
  HeartPulse,
  Leaf,
  ScrollText,
  Plus,
  PanelLeft,
} from "lucide-react";
import { toast } from "sonner";

const categories = [
  { id: "all", label: "Todas las categorías", icon: ScrollText },
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

type ComparisonSidebarPanelsProps = {
  selected: CandidateId[];
  onToggleCandidate: (id: CandidateId) => void;
  activeCategory: string;
  onSelectCategory: (id: string) => void;
};

function ComparisonSidebarPanels({
  selected,
  onToggleCandidate,
  activeCategory,
  onSelectCategory,
}: ComparisonSidebarPanelsProps) {
  return (
    <>
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
                    onCheckedChange={() => onToggleCandidate(c.id)}
                    className="shrink-0"
                  />
                  <img
                    src={c.foto}
                    alt={`Retrato de ${c.nombre}`}
                    loading="lazy"
                    width={40}
                    height={40}
                    className="h-10 w-10 shrink-0 rounded-full object-cover ring-2"
                    style={
                      {
                        "--tw-ring-color": `hsl(var(${c.colorVar}) / 0.6)`,
                      } as CSSProperties
                    }
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
                  type="button"
                  onClick={() => onSelectCategory(cat.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/80 hover:bg-secondary"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {cat.label}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}

const Index = () => {
  const [selected, setSelected] = useState<CandidateId[]>(["palo", "ivan", "abelardo"]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [input, setInput] = useState("Compara las propuestas en educación");
  const [lastQuery, setLastQuery] = useState("");
  const [ragAnswer, setRagAnswer] = useState("");
  const [ragProposals, setRagProposals] = useState<{ candidate: string; text: string }[]>([]);
  const [ragLoading, setRagLoading] = useState(false);
  const [ragError, setRagError] = useState<string | null>(null);
  const [smartByProposal, setSmartByProposal] = useState<Record<string, SmartEntry>>({});

  const topicLabel = useMemo(
    () => categories.find((c) => c.id === activeCategory)?.label ?? activeCategory,
    [activeCategory]
  );

  const toggleCandidate = (id: CandidateId) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const selectCategory = (id: string) => {
    setActiveCategory(id);
    setMobileNavOpen(false);
  };

  const activeCandidates = candidates.filter((c) => selected.includes(c.id));

  useEffect(() => {
    if (!ragProposals.length) {
      setSmartByProposal({});
      return;
    }
    let cancelled = false;
    const pairs = ragProposals.map((p, i) => ({
      key: `${p.candidate}-${i}`,
      proposal: p.text,
    }));
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
  }, [ragProposals]);

  const runQuery = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setShowAnswer(true);
    setLastQuery(trimmed);
    setRagLoading(true);
    setRagError(null);
    setRagAnswer("");
    setRagProposals([]);
    try {
      const data = await queryRag({
        question: trimmed,
        candidateIds: selected,
        category: activeCategory,
      });
      setRagAnswer(data.answer);
      setRagProposals(data.proposals ?? []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo contactar al servidor.";
      setRagError(msg);
      toast.error("Error al consultar el backend", { description: msg });
    } finally {
      setRagLoading(false);
    }
  };

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-background text-foreground">
      {/* Header */}
      <header className="z-30 shrink-0 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex min-h-14 max-w-[1440px] flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2.5 sm:h-16 sm:px-6 sm:py-0">
          <div className="flex min-w-0 max-w-[min(100%,20rem)] items-center gap-2.5 sm:max-w-none sm:gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground sm:h-9 sm:w-9">
              <ScrollText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold leading-tight sm:text-xl sm:font-normal">
                Comparador de Propuestas
              </h1>
              <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground sm:mt-1 sm:text-xs">
                Análisis neutral · Elecciones 2026
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Badge variant="secondary" className="hidden gap-1.5 font-normal sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--candidate-ivan))]" />
              Modo investigación
            </Badge>
            <PlatformHowToDialog />
            <SourcesDialog />
          </div>
        </div>
      </header>

      <div className="mx-auto grid min-h-0 w-full max-w-[1440px] flex-1 grid-cols-1 grid-rows-1 gap-4 overflow-hidden px-3 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:grid-cols-12 lg:grid-rows-[minmax(0,1fr)]">
        <aside className="hidden min-h-0 space-y-6 overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch] lg:col-span-3 lg:block">
          <ComparisonSidebarPanels
            selected={selected}
            onToggleCandidate={toggleCandidate}
            activeCategory={activeCategory}
            onSelectCategory={selectCategory}
          />
        </aside>

        <main className="col-span-1 flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm lg:col-span-9 lg:rounded-xl">
          <div className="flex shrink-0 flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
            <div className="flex min-w-0 flex-1 items-start gap-2 sm:items-center sm:gap-3">
              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0 lg:hidden"
                    aria-label="Candidatos y categorías"
                  >
                    <PanelLeft className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="flex h-[100dvh] max-h-[100dvh] min-h-0 w-full flex-col gap-0 overflow-hidden p-0 sm:h-[100dvh] sm:max-w-md"
                >
                  <SheetHeader className="shrink-0 border-b border-border px-6 pb-4 pt-6 text-left">
                    <SheetTitle>Candidatos y categorías</SheetTitle>
                  </SheetHeader>
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 [-webkit-overflow-scrolling:touch] [padding-bottom:max(1rem,env(safe-area-inset-bottom))]">
                    <div className="space-y-6">
                      <ComparisonSidebarPanels
                        selected={selected}
                        onToggleCandidate={toggleCandidate}
                        activeCategory={activeCategory}
                        onSelectCategory={selectCategory}
                      />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold leading-snug sm:text-2xl sm:font-normal">
                  Asistente de Análisis
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                  Comparando {activeCandidates.length} candidatos · Tema:{" "}
                  <span className="font-medium text-foreground">
                    {categories.find((c) => c.id === activeCategory)?.label}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex shrink-0 justify-end -space-x-2 ps-11 sm:justify-start sm:ps-0">
              {activeCandidates.map((c) => (
                <img
                  key={c.id}
                  src={c.foto}
                  alt={c.nombre}
                  loading="lazy"
                  width={32}
                  height={32}
                  className="h-7 w-7 rounded-full border-2 border-card object-cover sm:h-8 sm:w-8"
                />
              ))}
            </div>
          </div>

          {/* Conversation */}
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
            {!showAnswer ? (
              <EmptyState
                onPick={(q) => {
                  setInput(q);
                  void runQuery(q);
                }}
              />
            ) : (
              <>
                <div className="flex justify-end">
                  <div className="max-w-[78%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm text-primary-foreground">
                    {lastQuery}
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <Sparkles className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-5">
                    {ragLoading ? (
                      <p className="text-sm text-muted-foreground">Consultando documentos y generando respuesta…</p>
                    ) : ragError ? (
                      <p className="text-sm text-destructive">{ragError}</p>
                    ) : (
                      <>
                        <div>
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{ragAnswer}</p>
                        </div>

                        <div className="grid gap-3">
                          {activeCandidates.map((c) => {
                            const parts = ragProposals
                              .map((p, i) => ({ p, i }))
                              .filter(({ p }) => p.candidate === c.id);
                            return (
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
                                {parts.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">
                                    Sin fragmentos recuperados para este candidato con los filtros actuales.
                                  </p>
                                ) : (
                                  <div className="space-y-3">
                                    {parts.map(({ p, i }) => {
                                      const smartKey = `${p.candidate}-${i}`;
                                      return (
                                        <div key={smartKey} className="border-l-2 border-border/60 pl-3">
                                          <p className="text-sm text-foreground/85">{p.text}</p>
                                          <SmartEvaluationBlock entry={smartByProposal[smartKey]} />
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </article>
                            );
                          })}
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Fuentes: PDF indexados en el servidor (por candidato y categoría). La respuesta resume fragmentos
                          recuperados; revisa las citas en cada tarjeta.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Suggestions + Input */}
          <div className="shrink-0 border-t border-border px-4 py-3 sm:px-6 sm:py-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setInput(s);
                    void runQuery(s);
                  }}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:border-foreground/30 hover:bg-secondary"
                >
                  {s}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void runQuery(input);
              }}
              className="flex items-end gap-2 rounded-xl border border-border bg-background p-2 focus-within:border-foreground/30"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={1}
                placeholder="Haz una pregunta sobre los planes de gobierno…"
                className="flex-1 resize-none bg-transparent px-2 py-2 text-sm placeholder:text-muted-foreground focus:outline-none"
              />
              <Button type="submit" size="sm" className="gap-1.5" disabled={ragLoading}>
                <Send className="h-3.5 w-3.5" />
                {ragLoading ? "Enviando…" : "Enviar"}
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
    <h3 className="text-xl sm:text-2xl">Haz una pregunta sobre los planes de gobierno…</h3>
    <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
      Selecciona candidatos y categoría a la izquierda. El backend usa los PDF en{" "}
      <code className="rounded bg-muted px-1 py-0.5 text-[11px]">backend/data/&lt;id&gt;/</code> (subcarpetas por tema opcionales).
    </p>
    <div className="mt-6 grid max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
      {suggestions.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onPick(s)}
          className="rounded-lg border border-border bg-background p-3 text-left text-sm text-foreground/80 hover:border-foreground/30 hover:bg-secondary"
        >
          {s}
        </button>
      ))}
    </div>
  </div>
);

export default Index;
