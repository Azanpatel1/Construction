import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle2, AlertOctagon, Users, Calendar, Wrench, Activity } from "lucide-react";
import type { SolutionImpact } from "../lib/types";
import { formatUSD } from "../lib/format";

interface Props {
  impact: SolutionImpact | null;
  doNothingImpact: SolutionImpact | null;
  onClose: () => void;
}

export function SolutionDrilldown({ impact, doNothingImpact, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {impact && doNothingImpact && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-text/20 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl panel"
          >
            <div className="panel-header">
              <div>
                <p className="text-xs text-muted">Execution plan</p>
                <div className="mt-1 font-serif text-xl font-semibold text-text">
                  {impact.solution.name}
                </div>
              </div>
              <button
                className="text-muted hover:text-text transition p-1"
                onClick={onClose}
                aria-label="close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <p className="text-[13px] text-text/85 leading-relaxed">
                {impact.solution.oneLiner}
              </p>

              <div className="grid grid-cols-4 gap-3">
                <Stat
                  icon={<Activity className="w-3.5 h-3.5" />}
                  label="Total impact"
                  value={formatUSD(impact.totalImpactUSD)}
                  highlight
                />
                <Stat
                  icon={<Calendar className="w-3.5 h-3.5" />}
                  label="Schedule slip"
                  value={`${Math.round(impact.netScheduleSlipDays)} days`}
                />
                <Stat
                  icon={<Users className="w-3.5 h-3.5" />}
                  label="Crew"
                  value={`${impact.solution.crewRequired} FTE`}
                />
                <Stat
                  icon={<Wrench className="w-3.5 h-3.5" />}
                  label="Residual risk"
                  value={`${impact.solution.residualRiskScore}/100`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium text-muted mb-2">
                    Steps
                  </div>
                  <ol className="space-y-2">
                    {impact.solution.steps.map((step, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-[12px] text-text/90 leading-relaxed"
                      >
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gold-500/10 text-gold-600 text-[10px] font-semibold">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <div className="text-xs font-medium text-muted mb-2">
                    Cost breakdown
                  </div>
                  <BreakdownRow
                    label="Direct remediation"
                    value={impact.directCostUSD}
                  />
                  <BreakdownRow
                    label="Expected cascade"
                    value={impact.expectedDownstreamCostUSD}
                  />
                  <BreakdownRow
                    label="Capital carrying cost"
                    value={impact.carryingCostUSD}
                  />
                  <BreakdownRow
                    label="Rate-lock penalty"
                    value={impact.rateLockPenaltyUSD}
                    danger={impact.rateLockPenaltyUSD > 0}
                  />
                  <div className="mt-2 pt-2 border-t border-line/60">
                    <BreakdownRow
                      label="Total"
                      value={impact.totalImpactUSD}
                      bold
                    />
                    <BreakdownRow
                      label="Vs. do nothing"
                      value={-impact.savingsVsDoNothingUSD}
                      green={impact.savingsVsDoNothingUSD > 0}
                    />
                  </div>
                </div>
              </div>

              {!impact.feasible && (
                <div className="rounded-md border border-signal-red/40 bg-signal-red/10 px-3 py-2">
                  <div className="flex items-center gap-2 text-signal-red text-[12px] font-semibold">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    Feasibility blockers
                  </div>
                  <ul className="mt-1 ml-5 list-disc text-[11px] text-text/80">
                    {impact.feasibilityNotes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}

              {impact.feasibilityNotes.length > 0 && impact.feasible && (
                <div className="rounded-md border border-signal-amber/40 bg-signal-amber/10 px-3 py-2 text-[11px] text-signal-amber">
                  Note: {impact.feasibilityNotes.join(" ")}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] text-muted flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-signal-green" />
                  Press <kbd className="kbd">Esc</kbd> to close
                </div>
                <button className="btn-primary" onClick={onClose}>
                  Confirm path
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Stat({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-md border px-3 py-2 ${
        highlight
          ? "border-gold-500/40 bg-gold-500/5"
          : "border-line bg-ink-800/50"
      }`}
    >
      <div className="flex items-center gap-1.5 text-xs text-muted">
        {icon}
        {label}
      </div>
      <div
        className={`mt-1 text-sm tabular-nums font-medium ${
          highlight ? "text-gold-600" : "text-text"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  bold = false,
  green = false,
  danger = false,
}: {
  label: string;
  value: number;
  bold?: boolean;
  green?: boolean;
  danger?: boolean;
}) {
  const toneClass = green
    ? "text-signal-green"
    : danger
    ? "text-signal-red"
    : "text-text";
  const display = value < 0 ? formatUSD(value) : formatUSD(value);
  return (
    <div className="flex items-center justify-between py-1 text-[12px]">
      <span className={`${bold ? "text-text font-semibold" : "text-muted"}`}>
        {label}
      </span>
      <span
        className={`font-mono tabular-nums ${toneClass} ${
          bold ? "font-semibold" : ""
        }`}
      >
        {display}
      </span>
    </div>
  );
}
