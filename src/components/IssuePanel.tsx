import { useState, useEffect } from "react";
import { Play, RotateCcw, ChevronDown } from "lucide-react";
import type { Constraints, Scenario } from "../lib/types";
import { formatUSD, formatDate } from "../lib/format";
import { DrawingUpload } from "./DrawingUpload";

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
  const [uploadKey, setUploadKey] = useState(0);

  useEffect(() => {
    setC(initialConstraints);
    setIssueText(scenario.issue.description);
    setUploadKey((k) => k + 1);
  }, [scenario.project.id, initialConstraints, scenario.issue.description]);

  function handleReset() {
    setUploadKey((k) => k + 1);
    onReset();
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Issue</h2>
          <p className="panel-subtitle">Describe the discrepancy and constraints</p>
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
        <div className="p-5 space-y-5">
          <div className="space-y-4">
            <div>
              <label className="label-base">Drawing</label>
              <DrawingUpload
                layout="horizontal"
                resetKey={`${scenario.project.id}-${uploadKey}`}
                locationLabel={scenario.issue.location}
              />
            </div>
            <div>
              <label className="label-base">Issue description</label>
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

          <div className="h-px bg-line/60" />

          <div>
            <h3 className="text-sm font-medium text-text">Constraints</h3>
            <p className="text-xs text-muted mt-0.5">Adjust and re-run the analysis</p>
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
              onClick={handleReset}
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
              {isAnalyzing ? "Analyzing…" : "Run analysis"}
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
          <span className="text-sm tabular-nums text-gold-600 font-medium">
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
            background: `linear-gradient(to right, #B85C38 0%, #B85C38 ${pct}%, #E8E4DD ${pct}%, #E8E4DD 100%)`,
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
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
          value ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
