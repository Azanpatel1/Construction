import { Activity } from "lucide-react";
import type { Scenario } from "../lib/types";
import { formatDate, formatUSD, severityColor } from "../lib/format";

interface HeaderProps {
  scenario: Scenario;
  analyzedAt?: string | null;
}

export function Header({ scenario, analyzedAt }: HeaderProps) {
  const { project, issue } = scenario;
  return (
    <header className="border-b border-line bg-ink-850/90 px-8 py-5">
      <div className="flex items-start justify-between gap-8">
        <div className="min-w-0">
          <p className="text-xs text-muted">
            {project.assetClass} · {project.location}
          </p>
          <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-text">
            {project.name}
          </h1>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span
              className={`chip border border-line bg-ink-800 capitalize ${severityColor(
                issue.severity
              )}`}
            >
              {issue.severity}
            </span>
            <span className="text-sm text-muted">{issue.title}</span>
          </div>
        </div>
        <div className="flex items-start gap-6 shrink-0">
          <Stat label="Budget" value={formatUSD(project.totalBudgetUSD)} />
          <Stat
            label="Daily carry"
            value={formatUSD(project.dailyCarryingCostUSD)}
            highlight
          />
          <Stat
            label="Completion"
            value={formatDate(project.scheduledCompletion)}
          />
          <Stat
            label="Rate lock"
            value={formatDate(project.rateLockExpiry)}
          />
          {analyzedAt && (
            <div className="flex items-center gap-1.5 text-xs text-signal-green pt-1">
              <Activity className="w-3.5 h-3.5" />
              <span>Analyzed {analyzedAt}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="text-right">
      <div className="text-xs text-muted">{label}</div>
      <div
        className={`mt-0.5 text-sm tabular-nums font-medium ${
          highlight ? "text-gold-600" : "text-text"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
