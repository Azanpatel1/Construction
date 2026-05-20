import { Activity, ShieldCheck } from "lucide-react";
import type { Scenario } from "../lib/types";
import { formatDate, formatUSD, severityColor } from "../lib/format";

interface HeaderProps {
  scenario: Scenario;
  analyzedAt?: string | null;
}

export function Header({ scenario, analyzedAt }: HeaderProps) {
  const { project, issue } = scenario;
  return (
    <header className="border-b border-line/60 bg-ink-900/40 px-6 py-4">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted font-mono">
            <span>{project.assetClass}</span>
            <span className="opacity-40">/</span>
            <span>{project.location}</span>
            <span className="opacity-40">/</span>
            <span className="text-text/80">{project.id.toUpperCase()}</span>
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-text">
            {project.name}
          </h1>
          <div className="mt-1.5 flex items-center gap-3">
            <span
              className={`chip bg-ink-800/80 border border-line/60 ${severityColor(
                issue.severity
              )}`}
            >
              {issue.severity} severity
            </span>
            <span className="text-[13px] text-text/80">{issue.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <StatPill
            label="Total Budget"
            value={formatUSD(project.totalBudgetUSD)}
          />
          <StatPill
            label="Daily Carry"
            value={formatUSD(project.dailyCarryingCostUSD)}
            accent
          />
          <StatPill
            label="Sched. Completion"
            value={formatDate(project.scheduledCompletion)}
          />
          <StatPill
            label="Rate-Lock Expiry"
            value={formatDate(project.rateLockExpiry)}
          />
          <div className="ml-2 flex items-center gap-2 text-[11px] font-mono text-muted">
            {analyzedAt ? (
              <>
                <Activity className="w-3 h-3 text-signal-green animate-pulse" />
                <span>Analyzed {analyzedAt}</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3 h-3 text-muted/70" />
                <span>Awaiting model run</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function StatPill({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-md border px-3 py-1.5 ${
        accent
          ? "border-gold-500/40 bg-gold-500/5"
          : "border-line/60 bg-ink-850/60"
      }`}
    >
      <div className="text-[9px] uppercase tracking-[0.18em] text-muted font-mono">
        {label}
      </div>
      <div
        className={`mt-0.5 text-[13px] font-mono tabular-nums ${
          accent ? "text-gold-500" : "text-text"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
