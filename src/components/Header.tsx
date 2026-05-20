import { Activity } from "lucide-react";
import type { Scenario } from "../lib/types";

interface HeaderProps {
  scenario: Scenario;
  analyzedAt?: string | null;
}

export function Header({ scenario, analyzedAt }: HeaderProps) {
  const { project } = scenario;
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
        </div>
        {analyzedAt && (
          <div className="flex items-center gap-1.5 text-xs text-signal-green pt-1 shrink-0">
            <Activity className="w-3.5 h-3.5" />
            <span>Analyzed {analyzedAt}</span>
          </div>
        )}
      </div>
    </header>
  );
}
