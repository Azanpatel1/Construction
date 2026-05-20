import {
  AlertOctagon,
  Compass,
  FileText,
  Layers,
  ListChecks,
  Ruler,
  Sparkles,
  Workflow,
} from "lucide-react";
import type {
  AnalystOutput,
  RiskLevel,
  WorkPackageStatus,
} from "../lib/analyst";

interface Props {
  output: AnalystOutput;
}

const RISK_TONE: Record<RiskLevel, { label: string; chip: string; text: string; bar: string }> = {
  Low: {
    label: "Low",
    chip: "bg-signal-green/10 text-signal-green border-signal-green/30",
    text: "text-signal-green",
    bar: "bg-signal-green",
  },
  Medium: {
    label: "Medium",
    chip: "bg-signal-amber/10 text-signal-amber border-signal-amber/30",
    text: "text-signal-amber",
    bar: "bg-signal-amber",
  },
  High: {
    label: "High",
    chip: "bg-gold-500/10 text-gold-600 border-gold-500/30",
    text: "text-gold-600",
    bar: "bg-gold-500",
  },
  Critical: {
    label: "Critical",
    chip: "bg-signal-red/10 text-signal-red border-signal-red/30",
    text: "text-signal-red",
    bar: "bg-signal-red",
  },
};

const STATUS_TONE: Record<WorkPackageStatus, { chip: string; bar: string }> = {
  Proceed: {
    chip: "bg-signal-green/10 text-signal-green border-signal-green/30",
    bar: "bg-signal-green",
  },
  Conditional: {
    chip: "bg-signal-amber/10 text-signal-amber border-signal-amber/30",
    bar: "bg-signal-amber",
  },
  Hold: {
    chip: "bg-signal-red/10 text-signal-red border-signal-red/30",
    bar: "bg-signal-red",
  },
};

export function AnalystResults({ output }: Props) {
  const exec = output.executive;
  return (
    <div className="space-y-6">
      {/* Executive KPI banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard
          label="Overall risk"
          value={exec.overallRisk}
          tone={RISK_TONE[exec.overallRisk].text}
        />
        <KpiCard
          label="Drawing reliability"
          value={`${exec.drawingReliability}%`}
          tone="text-text"
          sublabel={output.drawingReliability.classification}
        />
        <KpiCard
          label="Recommended contingency"
          value={exec.contingencyRange}
          tone="text-gold-600"
        />
        <KpiCard
          label="Downtime risk"
          value={exec.downtimeRisk}
          tone={RISK_TONE[exec.downtimeRisk].text}
        />
        <KpiCard
          label="Primary cost driver"
          value={exec.primaryCostDriver}
          tone="text-text"
          compact
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1 — Project Risk Summary */}
        <Section
          title="Project risk summary"
          subtitle="Synthesis of all inputs"
          icon={<Sparkles className="w-4 h-4" />}
        >
          <p className="text-sm text-text leading-relaxed">
            {output.riskSummary}
          </p>
          {output.assumptions.length > 0 && (
            <div className="mt-4 rounded-md border border-line bg-ink-800/40 px-3 py-2">
              <div className="text-xs font-medium text-muted mb-1">
                Assumptions
              </div>
              <ul className="text-xs text-muted space-y-0.5">
                {output.assumptions.map((a, i) => (
                  <li key={i}>· {a}</li>
                ))}
              </ul>
            </div>
          )}
        </Section>

        {/* 2 — Drawing Reliability */}
        <Section
          title="Drawing reliability"
          subtitle={output.drawingReliability.classification}
          icon={<Ruler className="w-4 h-4" />}
        >
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-3xl font-semibold tabular-nums text-text">
              {output.drawingReliability.score}%
            </span>
            <span className="text-xs text-muted">
              of trusted-document threshold
            </span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-ink-800 overflow-hidden">
            <div
              className={`h-full ${
                output.drawingReliability.score >= 80
                  ? "bg-signal-green"
                  : output.drawingReliability.score >= 60
                  ? "bg-signal-amber"
                  : output.drawingReliability.score >= 31
                  ? "bg-gold-500"
                  : "bg-signal-red"
              }`}
              style={{ width: `${output.drawingReliability.score}%` }}
            />
          </div>
          <p className="mt-4 text-sm text-text/85 leading-relaxed">
            {output.drawingReliability.implication}
          </p>
        </Section>

        {/* 3 — Cost Forecast */}
        <Section
          title="Risk-adjusted cost forecast"
          subtitle={`${output.costForecast.contingencyMin}–${output.costForecast.contingencyMax}% contingency recommended`}
          icon={<Layers className="w-4 h-4" />}
        >
          <div className="flex items-baseline justify-between">
            <div>
              <span
                className={`chip border ${RISK_TONE[output.costForecast.level].chip}`}
              >
                {output.costForecast.level} cost risk
              </span>
            </div>
            <div className="text-sm tabular-nums text-gold-600 font-medium">
              {output.costForecast.contingencyMin}–
              {output.costForecast.contingencyMax}%
            </div>
          </div>
          <div className="mt-4 text-xs font-medium text-muted">
            Cost drivers
          </div>
          <ul className="mt-1.5 space-y-1.5">
            {output.costForecast.drivers.length === 0 && (
              <li className="text-sm text-muted">
                Standard project profile — no acute cost drivers identified.
              </li>
            )}
            {output.costForecast.drivers.map((d, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-text/90 leading-relaxed"
              >
                <span className="mt-1.5 inline-block w-1 h-1 rounded-full bg-gold-500 shrink-0" />
                {d}
              </li>
            ))}
          </ul>
        </Section>

        {/* 4 — Downtime Risk */}
        <Section
          title="Downtime risk"
          subtitle={output.downtime.mechanism}
          icon={<AlertOctagon className="w-4 h-4" />}
        >
          <div className="flex items-center gap-2">
            <span
              className={`chip border ${RISK_TONE[output.downtime.level].chip}`}
            >
              {output.downtime.level}
            </span>
            <span className="text-sm text-text font-medium">
              {output.downtime.mechanism}
            </span>
          </div>
          <p className="mt-4 text-sm text-text/85 leading-relaxed">
            {output.downtime.explanation}
          </p>
        </Section>
      </div>

      {/* 5 — Resource Allocation */}
      <Section
        title="Resource allocation"
        subtitle={output.resources.headline}
        icon={<Compass className="w-4 h-4" />}
      >
        <ol className="space-y-2.5">
          {output.resources.actions.map((a, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-text/90 leading-relaxed">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-500/10 text-gold-600 text-xs font-semibold">
                {i + 1}
              </span>
              {a}
            </li>
          ))}
        </ol>
      </Section>

      {/* 6 — Work Package Readiness */}
      <Section
        title="Work package readiness"
        subtitle="Where crews can productively land right now"
        icon={<Workflow className="w-4 h-4" />}
      >
        <div className="space-y-3">
          {output.workPackages.map((wp, i) => (
            <div
              key={i}
              className="grid grid-cols-12 items-center gap-3 px-1"
            >
              <div className="col-span-5">
                <div className="text-sm font-medium text-text leading-snug">
                  {wp.name}
                </div>
                <div className="mt-0.5 text-xs text-muted leading-relaxed">
                  {wp.reason}
                </div>
              </div>
              <div className="col-span-4">
                <div className="h-2 rounded-full bg-ink-800 overflow-hidden">
                  <div
                    className={`h-full ${STATUS_TONE[wp.status].bar}`}
                    style={{ width: `${wp.readiness}%` }}
                  />
                </div>
              </div>
              <div className="col-span-1 text-right">
                <span className="text-sm tabular-nums font-medium text-text">
                  {wp.readiness}%
                </span>
              </div>
              <div className="col-span-2 flex justify-end">
                <span
                  className={`chip border ${STATUS_TONE[wp.status].chip}`}
                >
                  {wp.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 7 — Top Recommended Actions */}
      <Section
        title="Top recommended actions"
        subtitle="Specific, immediate, decision-oriented"
        icon={<ListChecks className="w-4 h-4" />}
      >
        <ol className="space-y-2.5">
          {output.topActions.map((a, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-text/90 leading-relaxed">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-500 text-white text-xs font-semibold">
                {i + 1}
              </span>
              {a}
            </li>
          ))}
        </ol>
      </Section>

      {/* 8 — Executive Summary */}
      <Section
        title="Executive summary"
        subtitle="At-a-glance status"
        icon={<FileText className="w-4 h-4" />}
        accent
      >
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
          <SummaryRow label="Overall risk" value={exec.overallRisk} tone={RISK_TONE[exec.overallRisk].text} />
          <SummaryRow label="Drawing reliability" value={`${exec.drawingReliability}%`} />
          <SummaryRow label="Recommended contingency" value={exec.contingencyRange} tone="text-gold-600" />
          <SummaryRow label="Downtime risk" value={exec.downtimeRisk} tone={RISK_TONE[exec.downtimeRisk].text} />
          <SummaryRow label="Primary cost driver" value={exec.primaryCostDriver} wide />
          <SummaryRow label="Recommended next move" value={exec.recommendedNextMove} wide />
        </dl>
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Section({
  title,
  subtitle,
  icon,
  children,
  accent = false,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <section
      className={`panel ${accent ? "border-gold-500/30 shadow-glow" : ""}`}
    >
      <div className="panel-header">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 p-2 rounded-md ${
              accent
                ? "bg-gold-500/10 text-gold-600"
                : "bg-ink-800 text-muted"
            }`}
          >
            {icon}
          </div>
          <div>
            <h2 className="panel-title">{title}</h2>
            {subtitle && <p className="panel-subtitle">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function KpiCard({
  label,
  value,
  tone = "text-text",
  sublabel,
  compact = false,
}: {
  label: string;
  value: string;
  tone?: string;
  sublabel?: string;
  compact?: boolean;
}) {
  return (
    <div className="panel p-4">
      <div className="text-xs text-muted leading-snug">{label}</div>
      <div
        className={`mt-2 ${
          compact ? "text-sm" : "text-xl font-serif"
        } font-semibold tabular-nums leading-tight ${tone}`}
      >
        {value}
      </div>
      {sublabel && (
        <div className="mt-1 text-xs text-muted">{sublabel}</div>
      )}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  tone = "text-text",
  wide = false,
}: {
  label: string;
  value: string;
  tone?: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "md:col-span-3" : ""}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`mt-0.5 text-sm font-medium leading-snug ${tone}`}>{value}</dd>
    </div>
  );
}
