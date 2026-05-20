import { useState, useEffect, useMemo } from "react";
import { Activity, ChevronDown } from "lucide-react";
import {
  AnalystInput,
  ProjectType,
  ProjectPhase,
  RiskArea,
  ResourceConstraint,
} from "../lib/analyst";

const PROJECT_TYPES: ProjectType[] = [
  "Office",
  "Healthcare",
  "Lab / Life Sciences",
  "Industrial / Manufacturing",
  "Hospitality",
  "Residential",
  "Mixed-Use",
  "Retail",
  "Education",
  "Tenant Improvement",
  "Remodel / Renovation",
];

const PROJECT_PHASES: ProjectPhase[] = [
  "Pre-construction",
  "Design Development",
  "Permitting",
  "Mobilization",
  "Active Construction",
  "Commissioning",
  "Close-out",
];

const RISK_AREAS: RiskArea[] = [
  "Structural",
  "Mechanical",
  "Electrical",
  "Plumbing",
  "Fire Protection",
  "Envelope / Facade",
  "Site / Civil",
  "Interior Finishes",
  "Vertical Transport",
];

const RESOURCE_CONSTRAINTS: ResourceConstraint[] = [
  "Labor",
  "Materials",
  "Equipment",
  "Budget",
  "Time",
];

interface Props {
  value: AnalystInput;
  onChange: (next: AnalystInput) => void;
}

export function AnalystPanel({ value, onChange }: Props) {
  const [local, setLocal] = useState<AnalystInput>(value);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  // Debounce-light: push every change immediately. Compute is cheap.
  function update<K extends keyof AnalystInput>(key: K, v: AnalystInput[K]) {
    const next = { ...local, [key]: v };
    setLocal(next);
    onChange(next);
  }

  const confidencePct = useMemo(
    () => `${Math.round(local.drawingConfidence)}%`,
    [local.drawingConfidence]
  );

  const sliderBg = useMemo(() => {
    const p = Math.max(0, Math.min(100, local.drawingConfidence));
    return `linear-gradient(to right, #B85C38 0%, #B85C38 ${p}%, #E8E4DD ${p}%, #E8E4DD 100%)`;
  }, [local.drawingConfidence]);

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Project triage</h2>
          <p className="panel-subtitle">
            Quick risk and resource analysis — updates as you type
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-signal-green">
            <Activity className="w-3.5 h-3.5" />
            Live
          </span>
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
      </div>

      {expanded && (
        <div className="p-5 space-y-5">
          <div>
            <label className="label-base">Project description</label>
            <textarea
              className="input-base h-[80px] resize-none leading-relaxed"
              value={local.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Describe the project, scope, and any context that affects risk…"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label-base">Project type</label>
              <select
                className="input-base"
                value={local.projectType}
                onChange={(e) =>
                  update("projectType", e.target.value as ProjectType)
                }
              >
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-base">Project size</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  className="input-base pr-12"
                  value={local.sizeSqft || ""}
                  onChange={(e) =>
                    update("sizeSqft", parseInt(e.target.value || "0", 10))
                  }
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
                  sq ft
                </span>
              </div>
            </div>
            <div>
              <label className="label-base">Project phase</label>
              <select
                className="input-base"
                value={local.phase}
                onChange={(e) => update("phase", e.target.value as ProjectPhase)}
              >
                {PROJECT_PHASES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label className="label-base">Drawing confidence</label>
              <span className="text-sm tabular-nums text-gold-600 font-medium">
                {confidencePct}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={local.drawingConfidence}
              onChange={(e) =>
                update("drawingConfidence", parseInt(e.target.value, 10))
              }
              className="archimpact-range w-full"
              style={{ background: sliderBg }}
            />
            <div className="mt-1.5 flex justify-between text-[10px] text-muted">
              <span>0% Very unreliable</span>
              <span>30%</span>
              <span>60%</span>
              <span>80%</span>
              <span>100% High reliability</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Primary risk area</label>
              <select
                className="input-base"
                value={local.riskArea}
                onChange={(e) => update("riskArea", e.target.value as RiskArea)}
              >
                {RISK_AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-base">Resource constraint</label>
              <select
                className="input-base"
                value={local.resourceConstraint}
                onChange={(e) =>
                  update(
                    "resourceConstraint",
                    e.target.value as ResourceConstraint
                  )
                }
              >
                {RESOURCE_CONSTRAINTS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label-base">Current blocker</label>
            <textarea
              className="input-base h-[64px] resize-none leading-relaxed"
              value={local.blocker}
              onChange={(e) => update("blocker", e.target.value)}
              placeholder="e.g. open RFI on column reframe, long-lead AHU, inspection failure — leave empty if none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
