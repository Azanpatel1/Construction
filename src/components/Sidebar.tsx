import { Building2, AlertTriangle, FolderOpen, Clock } from "lucide-react";
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
    <aside className="w-[280px] shrink-0 border-r border-line/60 bg-ink-900/60 flex flex-col">
      <div className="px-5 py-5 border-b border-line/60">
        <Logo />
        <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-muted font-mono">
          Construction Risk Underwriting
        </div>
      </div>

      <div className="px-4 pt-5 pb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
          Active Impact Analyses
        </span>
        <FolderOpen className="w-3.5 h-3.5 text-muted" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
        {scenarios.map((s) => {
          const active = s.project.id === activeId;
          return (
            <button
              key={s.project.id}
              onClick={() => onSelect(s.project.id)}
              className={`w-full text-left rounded-lg border px-3 py-3 transition group ${
                active
                  ? "bg-ink-800/80 border-gold-500/40 shadow-glow"
                  : "bg-ink-850/40 border-line/60 hover:bg-ink-800/60 hover:border-line"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`mt-0.5 p-1.5 rounded-md ${
                    active ? "bg-gold-500/15" : "bg-ink-800"
                  }`}
                >
                  <Building2
                    className={`w-3.5 h-3.5 ${
                      active ? "text-gold-500" : "text-muted"
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-text leading-snug truncate">
                    {s.project.name}
                  </div>
                  <div className="text-[11px] text-muted mt-0.5 font-mono">
                    {s.project.location}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-muted">
                    <span className="flex items-center gap-1">
                      <span className="opacity-60">Budget</span>
                      <span className="font-mono text-text/80">
                        {formatUSD(s.project.totalBudgetUSD)}
                      </span>
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <AlertTriangle
                      className={`w-3 h-3 ${severityColor(s.issue.severity)}`}
                    />
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider ${severityColor(
                        s.issue.severity
                      )}`}
                    >
                      {s.issue.severity}
                    </span>
                    <span className="text-[10px] text-muted truncate">
                      · {s.issue.title}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-muted">
                    <Clock className="w-2.5 h-2.5" />
                    <span className="font-mono">
                      Disc. {formatDate(s.issue.discoveredAt)}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-line/60 text-[10px] text-muted font-mono uppercase tracking-wider">
        2 active · 0 archived
      </div>
    </aside>
  );
}
