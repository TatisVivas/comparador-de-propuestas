import type { SmartEvaluation } from "@/lib/smartEvaluation";

type SmartEntry = { status: "loading" } | { status: "done"; data: SmartEvaluation };

export function SmartEvaluationBlock({ entry }: { entry: SmartEntry | undefined }) {
  if (!entry || entry.status === "loading") {
    return (
      <p className="mt-1.5 text-[11px] text-muted-foreground">Evaluación S·M·A·T…</p>
    );
  }

  const e = entry.data;
  const row = (k: keyof SmartEvaluation, label: string) => (
    <div key={k} className="grid grid-cols-[1.25rem_2.5rem_1fr] gap-x-2 gap-y-0.5 text-[11px] leading-snug">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className="tabular-nums text-foreground/90">{e[k].score.toFixed(2)}</span>
      <span className="text-muted-foreground">{e[k].explanation}</span>
    </div>
  );

  return (
    <details className="mt-2 rounded-md border border-border/60 bg-secondary/20 px-2 py-1.5">
      <summary className="cursor-pointer text-[11px] font-medium text-muted-foreground">
        Evaluación S·M·A·T
      </summary>
      <div className="mt-2 space-y-2 border-t border-border/40 pt-2">
        {row("S", "S")}
        {row("M", "M")}
        {row("A", "A")}
        {row("T", "T")}
      </div>
    </details>
  );
}
