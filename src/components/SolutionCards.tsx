import { ArrowRight, Check, ShieldAlert, Users, Calendar, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import type { AnalysisResult, SolutionImpact } from "../lib/types";
import { formatUSD } from "../lib/format";

interface Props {
  analysis: AnalysisResult;
  onSelect: (impact: SolutionImpact) => void;
  selectedId: string | null;
}

const strategyAccent: Record<string, { ring: string; chip: string; chipText: string }> = {
  recommended: {
    ring: "border-gold-500/60 shadow-glow",
    chip: "bg-gold-500/15 border-gold-500/40",
    chipText: "text-gold-500",
  },
  conservative: {
    ring: "border-line/60",
    chip: "bg-signal-blue/10 border-signal-blue/30",
    chipText: "text-signal-blue",
  },
  aggressive: {
    ring: "border-line/60",
    chip: "bg-signal-red/10 border-signal-red/30",
    chipText: "text-signal-red",
  },
  "do-nothing": {
    ring: "border-line/60 opacity-80",
    chip: "bg-ink-700 border-line",
    chipText: "text-muted",
  },
};

export function SolutionCards({ analysis, onSelect, selectedId }: Props) {
  const all = analysis.scenario.solutions
    .map((s) => analysis.bySolution[s.id])
    .sort((a, b) => orderRank(a) - orderRank(b));

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Mitigation options</h2>
          <p className="panel-subtitle">Ranked by total impact — click for detail</p>
        </div>
        <div className="text-xs text-muted">
          Best fit: <span className="text-gold-600 font-medium">
            {analysis.bySolution[analysis.recommendedId].solution.name}
          </span>
        </div>
      </div>
      <div className="p-4 grid grid-cols-4 gap-3">
        {all.map((impact, idx) => {
          const isRecommended = impact.solution.id === analysis.recommendedId;
          const accent =
            strategyAccent[
              isRecommended ? "recommended" : impact.solution.strategy
            ];
          const isSelected = selectedId === impact.solution.id;

          return (
            <motion.button
              key={impact.solution.id}
              onClick={() => onSelect(impact)}
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 26 }}
              className={`text-left rounded-lg border bg-ink-850 p-4 transition ${
                isRecommended ? accent.ring : "border-line hover:border-ink-600 hover:shadow-panel"
              } ${isSelected ? "ring-2 ring-gold-500/30" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`chip border ${accent.chip} ${accent.chipText}`}
                >
                  {isRecommended && <Check className="w-3 h-3" />}
                  {labelFor(impact.solution.strategy, isRecommended)}
                </span>
                {!impact.feasible && (
                  <span className="chip border border-signal-red/40 bg-signal-red/10 text-signal-red">
                    <AlertTriangle className="w-3 h-3" /> Blocked
                  </span>
                )}
              </div>
              <div className="mt-3 text-[14px] font-medium text-text leading-snug">
                {impact.solution.name}
              </div>
              <div className="mt-1.5 text-[11px] text-muted leading-relaxed line-clamp-2">
                {impact.solution.oneLiner}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <Cell
                  label="Total impact"
                  value={formatUSD(impact.totalImpactUSD)}
                  tone={isRecommended ? "good" : "neutral"}
                />
                <Cell
                  label="Schedule slip"
                  value={`${Math.round(impact.netScheduleSlipDays)}d`}
                  tone={impact.netScheduleSlipDays > 20 ? "bad" : "neutral"}
                />
                <Cell
                  label="Direct cost"
                  value={formatUSD(impact.directCostUSD)}
                />
                <Cell
                  label="Residual risk"
                  value={`${impact.solution.residualRiskScore}/100`}
                  tone={
                    impact.solution.residualRiskScore > 60
                      ? "bad"
                      : impact.solution.residualRiskScore < 30
                      ? "good"
                      : "neutral"
                  }
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-muted">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> {impact.solution.crewRequired} FTE
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {impact.solution.scheduleDeltaDays}d direct
                </div>
                <ArrowRight className="w-3 h-3 text-gold-500" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function Cell({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "good" | "bad" | "neutral";
}) {
  const toneClass =
    tone === "good"
      ? "text-signal-green"
      : tone === "bad"
      ? "text-signal-red"
      : "text-text";
  return (
    <div className="rounded-md bg-ink-800/60 border border-line px-2 py-1.5">
      <div className="text-[10px] text-muted">{label}</div>
      <div className={`mt-0.5 text-xs tabular-nums font-medium ${toneClass}`}>
        {value}
      </div>
    </div>
  );
}

function labelFor(strategy: string, isRecommended: boolean): string {
  if (isRecommended) return "Recommended";
  switch (strategy) {
    case "conservative":
      return "Conservative";
    case "aggressive":
      return "Aggressive";
    case "do-nothing":
      return "Do nothing";
    default:
      return strategy;
  }
}

function orderRank(s: SolutionImpact): number {
  // do-nothing last; otherwise by total impact ascending
  if (s.solution.id === "do-nothing") return 9999;
  return s.totalImpactUSD;
}
