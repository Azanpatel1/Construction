import { TrendingDown, TrendingUp, AlertOctagon, Calendar } from "lucide-react";
import type { AnalysisResult } from "../lib/types";
import { formatUSD, formatPct } from "../lib/format";

interface Props {
  analysis: AnalysisResult;
}

export function ImpactSummary({ analysis }: Props) {
  const recommended = analysis.bySolution[analysis.recommendedId];
  const doNothing = analysis.doNothing;

  const savingsPct =
    doNothing.totalImpactUSD > 0
      ? recommended.savingsVsDoNothingUSD / doNothing.totalImpactUSD
      : 0;

  return (
    <div className="grid grid-cols-4 gap-3">
      <SummaryCard
        title="Exposure if no action"
        value={formatUSD(doNothing.totalImpactUSD)}
        subtitle={`${Math.round(doNothing.netScheduleSlipDays)}d expected slip`}
        tone="bad"
        icon={<AlertOctagon className="w-4 h-4" />}
      />
      <SummaryCard
        title="Recommended path cost"
        value={formatUSD(recommended.totalImpactUSD)}
        subtitle={recommended.solution.name}
        tone="neutral"
        icon={<TrendingDown className="w-4 h-4" />}
      />
      <SummaryCard
        title="Capital preserved"
        value={formatUSD(recommended.savingsVsDoNothingUSD)}
        subtitle={`${formatPct(savingsPct)} vs. do-nothing`}
        tone="good"
        icon={<TrendingUp className="w-4 h-4" />}
      />
      <SummaryCard
        title="Schedule recovered"
        value={`${Math.round(recommended.daysSavedVsDoNothing)} days`}
        subtitle={`Net slip ${Math.round(recommended.netScheduleSlipDays)}d`}
        tone="good"
        icon={<Calendar className="w-4 h-4" />}
      />
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  tone,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  tone: "good" | "bad" | "neutral";
  icon: React.ReactNode;
}) {
  const valueClass =
    tone === "good"
      ? "text-signal-green"
      : tone === "bad"
      ? "text-signal-red"
      : "text-text";
  const iconBg =
    tone === "good"
      ? "bg-signal-green/10 text-signal-green"
      : tone === "bad"
      ? "bg-signal-red/10 text-signal-red"
      : "bg-gold-500/10 text-gold-500";
  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted font-mono">
          {title}
        </div>
        <div className={`p-1.5 rounded-md ${iconBg}`}>{icon}</div>
      </div>
      <div
        className={`mt-2 text-2xl font-mono tabular-nums font-semibold ${valueClass}`}
      >
        {value}
      </div>
      <div className="mt-1 text-[11px] text-muted">{subtitle}</div>
    </div>
  );
}
