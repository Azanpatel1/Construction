import { useEffect, useMemo, useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { DrawingUpload } from "./DrawingUpload";
import { formatUSD } from "../lib/format";
import type { UnifiedInput } from "../lib/runAnalysis";
import type {
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
  value: UnifiedInput;
  scenarioId: string;
  isAnalyzing: boolean;
  onChange: (next: UnifiedInput) => void;
  onRun: (final: UnifiedInput) => void;
  onReset: () => void;
}

export function InputPanel({
  value,
  scenarioId,
  isAnalyzing,
  onChange,
  onRun,
  onReset,
}: Props) {
  const [local, setLocal] = useState<UnifiedInput>(value);
  const [uploadKey, setUploadKey] = useState(0);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  function update<K extends keyof UnifiedInput>(k: K, v: UnifiedInput[K]) {
    const next = { ...local, [k]: v };
    setLocal(next);
    onChange(next);
  }

  function handleReset() {
    setUploadKey((k) => k + 1);
    onReset();
  }

  function handleRun() {
    onRun(local);
  }

  const confidenceBg = useMemo(() => {
    const p = Math.max(0, Math.min(100, local.drawingConfidence));
    return `linear-gradient(to right, #B85C38 0%, #B85C38 ${p}%, #E8E4DD ${p}%, #E8E4DD 100%)`;
  }, [local.drawingConfidence]);

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Project inputs</h2>
          <p className="panel-subtitle">
            Upload the drawing, define the project, then run the analysis
          </p>
        </div>
        <div className="text-xs text-muted hidden md:block">
          Step 1 → Step 2 → Run
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* ── Step 1: Drawing ── */}
        <Section step="1" title="Drawing" subtitle="Upload the reference drawing">
          <DrawingUpload
            layout="horizontal"
            resetKey={`${scenarioId}-${uploadKey}`}
            locationLabel={local.issueLocation}
          />
        </Section>

        {/* ── Step 2: Project ── */}
        <Section step="2" title="Project" subtitle="Describe the project and the issue">
          <div className="space-y-4">
            <div>
              <label className="label-base">Project description</label>
              <textarea
                className="input-base h-[80px] resize-none leading-relaxed"
                value={local.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Describe the project, scope, and the drawing discrepancy or coordination conflict driving the analysis…"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Project type">
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
              </Field>
              <Field label="Project size">
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
              </Field>
              <Field label="Project phase">
                <select
                  className="input-base"
                  value={local.phase}
                  onChange={(e) =>
                    update("phase", e.target.value as ProjectPhase)
                  }
                >
                  {PROJECT_PHASES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <label className="label-base">Drawing confidence</label>
                <span className="text-sm tabular-nums text-gold-600 font-medium">
                  {Math.round(local.drawingConfidence)}%
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
                style={{ background: confidenceBg }}
              />
              <div className="mt-1.5 flex justify-between text-[10px] text-muted">
                <span>0% Very unreliable</span>
                <span>30%</span>
                <span>60%</span>
                <span>80%</span>
                <span>100% High reliability</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Primary risk area">
                <select
                  className="input-base"
                  value={local.riskArea}
                  onChange={(e) =>
                    update("riskArea", e.target.value as RiskArea)
                  }
                >
                  {RISK_AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Resource constraint">
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
              </Field>
              <Field label="Issue location">
                <input
                  className="input-base"
                  value={local.issueLocation}
                  onChange={(e) => update("issueLocation", e.target.value)}
                  placeholder="e.g. Floor 14, Cores B & C"
                />
              </Field>
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
        </Section>

        {/* ── Step 3: Constraints ── */}
        <Section step="3" title="Constraints" subtitle="Available resources and risk tolerance">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <SliderField
              label="Budget headroom"
              value={local.budgetHeadroomUSD}
              min={0}
              max={10_000_000}
              step={50_000}
              format={(v) => formatUSD(v)}
              onChange={(v) => update("budgetHeadroomUSD", v)}
            />
            <SliderField
              label="Crew size"
              value={local.crewSize}
              min={4}
              max={40}
              step={1}
              format={(v) => `${v} FTE`}
              onChange={(v) => update("crewSize", v)}
            />
            <SliderField
              label="Risk appetite"
              value={local.riskAppetite}
              min={0}
              max={1}
              step={0.05}
              format={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => update("riskAppetite", v)}
              hint={
                local.riskAppetite < 0.4
                  ? "Conservative"
                  : local.riskAppetite > 0.7
                  ? "Aggressive"
                  : "Balanced"
              }
            />
            <div className="flex items-center justify-between gap-3 pt-6">
              <label className="text-xs text-muted font-medium">
                Materials constrained
              </label>
              <Toggle
                value={local.materialsConstrained}
                onChange={(v) => update("materialsConstrained", v)}
              />
            </div>
          </div>
        </Section>

        <div className="flex items-center justify-between pt-2 border-t border-line">
          <button
            type="button"
            onClick={handleReset}
            className="btn-ghost"
            disabled={isAnalyzing}
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            type="button"
            onClick={handleRun}
            disabled={isAnalyzing}
            className="btn-primary"
          >
            <Play className="w-3.5 h-3.5" />
            {isAnalyzing ? "Analyzing…" : "Run analysis"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  step,
  title,
  subtitle,
  children,
}: {
  step: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-3">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-500/10 text-gold-600 text-[11px] font-semibold">
          {step}
        </span>
        <div>
          <h3 className="text-sm font-medium text-text">{title}</h3>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
      </div>
      <div className="pl-8">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label-base">{label}</label>
      {children}
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
          {hint && <span className="text-xs text-muted">{hint}</span>}
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
      aria-pressed={value}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
          value ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
