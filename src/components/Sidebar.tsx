import { Building2, AlertTriangle, Clock } from "lucide-react";
import type { Scenario } from "../lib/types";
import { formatUSD, formatDate, severityColor } from "../lib/format";
import { Logo } from "./Logo";

interface SidebarProps {
  scenarios: Scenario[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function Sidebar({ scenarios, activeId, onSelect }: SidebarProps) {
  return (
    <aside className="w-[260px] shrink-0 border-r border-line bg-ink-850 flex flex-col">
      <div className="px-5 py-6 border-b border-line">
        <Logo />
        <p className="mt-2 text-xs text-muted leading-relaxed">
          Impact analysis for drawing discrepancies
        </p>
      </div>

      <div className="px-5 pt-5 pb-2">
        <span className="text-xs font-medium text-muted">Projects</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-1.5">
        {scenarios.map((s) => {
          const active = s.project.id === activeId;
          return (
            <button
              key={s.project.id}
              onClick={() => onSelect(s.project.id)}
              className={`w-full text-left rounded-md border px-3 py-3 transition ${
                active
                  ? "bg-ink-800/80 border-gold-500/30 shadow-glow"
                  : "border-transparent hover:bg-ink-800/50 hover:border-line"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <Building2
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    active ? "text-gold-500" : "text-muted"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-text leading-snug">
                    {s.project.name}
                  </div>
                  <div className="text-xs text-muted mt-0.5">
                    {s.project.location}
                  </div>
                  <div className="mt-2 text-xs text-muted tabular-nums">
                    {formatUSD(s.project.totalBudgetUSD)}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <AlertTriangle
                      className={`w-3 h-3 shrink-0 ${severityColor(s.issue.severity)}`}
                    />
                    <span
                      className={`text-xs capitalize ${severityColor(s.issue.severity)}`}
                    >
                      {s.issue.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted line-clamp-2 leading-relaxed">
                    {s.issue.title}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1 text-xs text-muted/80">
                    <Clock className="w-3 h-3" />
                    {formatDate(s.issue.discoveredAt)}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-line text-xs text-muted">
        2 active projects
      </div>
    </aside>
  );
}
