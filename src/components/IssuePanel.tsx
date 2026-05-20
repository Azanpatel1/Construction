import { useState, useEffect } from "react";
import { Play, FileImage, RotateCcw, ChevronDown } from "lucide-react";
import type { Constraints, Scenario } from "../lib/types";
import { formatUSD, formatDate } from "../lib/format";

interface Props {
  scenario: Scenario;
  initialConstraints: Constraints;
  isAnalyzing: boolean;
  onRun: (constraints: Constraints) => void;
  onReset: () => void;
}

export function IssuePanel({
  scenario,
  initialConstraints,
  isAnalyzing,
  onRun,
  onReset,
}: Props) {
  const [c, setC] = useState<Constraints>(initialConstraints);
  const [issueText, setIssueText] = useState<string>(scenario.issue.description);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    setC(initialConstraints);
    setIssueText(scenario.issue.description);
  }, [scenario.project.id, initialConstraints, scenario.issue.description]);

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <span className="panel-title">Issue Definition</span>
          <span className="chip border border-line/60 bg-ink-800/60 text-muted">
            Step 1 of 2
          </span>
        </div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-muted hover:text-text transition"
          aria-label="toggle"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              expanded ? "" : "-rotate-90"
            }`}
          />
        </button>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Drawing thumbnail placeholder */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3">
              <label className="label-base">Drawing Reference</label>
              <DrawingThumbnail title={scenario.issue.location} />
            </div>
            <div className="col-span-9 space-y-3">
              <div>
                <label className="label-base">Issue Description</label>
                <textarea
                  className="input-base h-[88px] resize-none leading-relaxed"
                  value={issueText}
                  onChange={(e) => setIssueText(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label-base">Location</label>
                  <input
                    className="input-base"
                    defaultValue={scenario.issue.location}
                  />
                </div>
                <div>
                  <label className="label-base">Severity</label>
                  <select className="input-base" defaultValue={scenario.issue.severity}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="label-base">Discovered</label>
                  <input
                    className="input-base"
                    defaultValue={formatDate(scenario.issue.discoveredAt)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-line/60" />

          <div className="flex items-center justify-between">
            <span className="panel-title">Constraints</span>
            <span className="text-[10px] font-mono text-muted">
              Adjust to re-run the impact model
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <SliderField
              label="Budget Headroom"
              value={c.budgetHeadroomUSD}
              min={0}
              max={10_000_000}
              step={50_000}
              format={(v) => formatUSD(v)}
              onChange={(v) => setC({ ...c, budgetHeadroomUSD: v })}
            />
            <SliderField
              label="Crew Size (FTE)"
              value={c.crewSize}
              min={4}
              max={40}
              step={1}
              format={(v) => `${v} FTE`}
              onChange={(v) => setC({ ...c, crewSize: v })}
            />
            <SliderField
              label="Risk Appetite"
              value={c.riskAppetite}
              min={0}
              max={1}
              step={0.05}
              format={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => setC({ ...c, riskAppetite: v })}
              hint={c.riskAppetite < 0.4 ? "Conservative" : c.riskAppetite > 0.7 ? "Aggressive" : "Balanced"}
            />
            <div className="flex items-center justify-between gap-3 pt-6">
              <label className="text-[11px] uppercase tracking-wider text-muted font-medium">
                Materials Constrained
              </label>
              <Toggle
                value={c.materialsConstrained}
                onChange={(v) => setC({ ...c, materialsConstrained: v })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={onReset}
              className="btn-ghost"
              type="button"
              disabled={isAnalyzing}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
            <button
              onClick={() => onRun(c)}
              disabled={isAnalyzing}
              className="btn-primary"
              type="button"
            >
              <Play className="w-3.5 h-3.5" />
              {isAnalyzing ? "Running model..." : "Run impact model"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
  hint?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="label-base">{label}</label>
        <div className="flex items-baseline gap-2">
          {hint && (
            <span className="text-[10px] font-mono text-muted">{hint}</span>
          )}
          <span className="text-[12px] font-mono tabular-nums text-gold-500">
            {format(value)}
          </span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="archimpact-range w-full"
        style={
          {
            background: `linear-gradient(to right, #D4A24C 0%, #D4A24C ${pct}%, #2A3344 ${pct}%, #2A3344 100%)`,
          } as React.CSSProperties
        }
      />
    </div>
  );
}

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
        value ? "bg-gold-500" : "bg-ink-700"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-ink-950 transition ${
          value ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function DrawingThumbnail({ title }: { title: string }) {
  return (
    <div className="aspect-[4/5] rounded-md border border-line/70 bg-gradient-to-br from-ink-900 to-ink-850 p-3 flex flex-col">
      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-muted">
        <FileImage className="w-3 h-3" /> A-201
      </div>
      <div className="flex-1 grid place-items-center relative overflow-hidden">
        {/* Decorative architectural drawing */}
        <svg
          viewBox="0 0 120 140"
          className="w-full h-full opacity-90"
          fill="none"
        >
          <defs>
            <pattern
              id="grid"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="#2A3344"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="120" height="140" fill="url(#grid)" />
          {/* Floor plate outline */}
          <rect
            x="18"
            y="22"
            width="84"
            height="96"
            stroke="#6B7A93"
            strokeWidth="1"
            fill="rgba(20,27,38,0.4)"
          />
          {/* Columns */}
          {[28, 48, 68, 88].map((x) => (
            <g key={x}>
              <rect x={x - 2} y="30" width="4" height="4" fill="#6B7A93" />
              <rect x={x - 2} y="56" width="4" height="4" fill="#6B7A93" />
              <rect x={x - 2} y="82" width="4" height="4" fill="#6B7A93" />
              <rect x={x - 2} y="108" width="4" height="4" fill="#6B7A93" />
            </g>
          ))}
          {/* Misaligned columns highlighted */}
          <g>
            <rect x="52" y="54" width="4" height="4" fill="#F25C5C" />
            <rect x="72" y="54" width="4" height="4" fill="#F25C5C" />
            <circle
              cx="64"
              cy="56"
              r="12"
              stroke="#F25C5C"
              strokeWidth="1"
              fill="none"
              strokeDasharray="2 2"
            />
            <line
              x1="64"
              y1="56"
              x2="98"
              y2="40"
              stroke="#F25C5C"
              strokeWidth="0.5"
            />
            <text
              x="100"
              y="40"
              fill="#F25C5C"
              fontSize="5"
              fontFamily="monospace"
            >
              Δ 18&quot;
            </text>
          </g>
        </svg>
      </div>
      <div className="text-[9px] font-mono text-muted truncate">
        {title}
      </div>
    </div>
  );
}
