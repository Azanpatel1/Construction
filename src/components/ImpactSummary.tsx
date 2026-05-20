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
    <div className="grid grid-cols-4 gap-4">
      <SummaryCard
        title="Exposure if no action"
        value={formatUSD(doNothing.totalImpactUSD)}
        subtitle={`${Math.round(doNothing.netScheduleSlipDays)} days slip`}
        tone="bad"
        icon={<AlertOctagon className="w-4 h-4" />}
      />
      <SummaryCard
        title="Recommended path"
        value={formatUSD(recommended.totalImpactUSD)}
        subtitle={recommended.solution.name}
        tone="neutral"
        icon={<TrendingDown className="w-4 h-4" />}
      />
      <SummaryCard
        title="Capital preserved"
        value={formatUSD(recommended.savingsVsDoNothingUSD)}
        subtitle={`${formatPct(savingsPct)} vs. deferring`}
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
  const iconClass =
    tone === "good"
      ? "text-signal-green"
      : tone === "bad"
      ? "text-signal-red"
      : "text-gold-500";
  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-muted leading-snug">{title}</span>
        <span className={iconClass}>{icon}</span>
      </div>
      <div
        className={`mt-3 text-2xl tabular-nums font-semibold font-serif ${valueClass}`}
      >
        {value}
      </div>
      <p className="mt-1 text-xs text-muted">{subtitle}</p>
    </div>
  );
}
