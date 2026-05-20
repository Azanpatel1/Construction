import {
  Compass,
  ListChecks,
  Sparkles,
  Workflow,
} from "lucide-react";
import { CostWaterfall } from "./CostWaterfall";
import { TimelineGantt } from "./TimelineGantt";
import { CascadeGraph } from "./CascadeGraph";
import type {
  AnalystOutput,
  RiskLevel,
  WorkPackageStatus,
} from "../lib/analyst";
import type { AnalysisResult, Scenario } from "../lib/types";

interface Props {
  analyst: AnalystOutput;
  cascade: AnalysisResult;
  scenario: Scenario;
}

const RISK_TONE: Record<
  RiskLevel,
  { chip: string; text: string; bar: string }
> = {
  Low: {
    chip: "bg-signal-green/10 text-signal-green border-signal-green/30",
    text: "text-signal-green",
    bar: "bg-signal-green",
  },
  Medium: {
    chip: "bg-signal-amber/10 text-signal-amber border-signal-amber/30",
    text: "text-signal-amber",
    bar: "bg-signal-amber",
  },
  High: {
    chip: "bg-gold-500/10 text-gold-600 border-gold-500/30",
    text: "text-gold-600",
    bar: "bg-gold-500",
  },
  Critical: {
    chip: "bg-signal-red/10 text-signal-red border-signal-red/30",
    text: "text-signal-red",
    bar: "bg-signal-red",
  },
};

const RISK_BAR_PCT: Record<RiskLevel, number> = {
  Low: 28,
  Medium: 55,
  High: 78,
  Critical: 95,
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

export function ResultsView({ analyst, cascade, scenario }: Props) {
  const recommended = cascade.bySolution[cascade.recommendedId];
  const overallRisk = analyst.executive.overallRisk;
  const overallTone = RISK_TONE[overallRisk];

  return (
    <div className="space-y-6">
      {/* ── KPI ROW: Overall Risk + Primary Cost Driver ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="panel p-5">
          <div className="flex items-baseline justify-between">
            <div className="text-xs uppercase tracking-wider text-muted font-medium">
              Overall risk
            </div>
            <span className={`chip border ${overallTone.chip}`}>
              {overallRisk}
            </span>
          </div>
          <div
            className={`mt-3 font-serif text-3xl font-semibold tracking-tight ${overallTone.text}`}
          >
            {overallRisk}
          </div>
          <div className="mt-3 h-2 rounded-full bg-ink-800 overflow-hidden">
            <div
              className={`h-full ${overallTone.bar}`}
              style={{ width: `${RISK_BAR_PCT[overallRisk]}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-muted leading-relaxed">
            Synthesis of cost-risk ({analyst.costForecast.level.toLowerCase()})
            and downtime risk ({analyst.downtime.level.toLowerCase()}).
            Recommended contingency {analyst.executive.contingencyRange}.
          </p>
        </div>

        <div className="panel p-5">
          <div className="flex items-baseline justify-between">
            <div className="text-xs uppercase tracking-wider text-muted font-medium">
              Primary cost driver
            </div>
            <span className="text-xs tabular-nums text-gold-600 font-medium">
              {analyst.executive.contingencyRange}
            </span>
          </div>
          <div className="mt-3 font-serif text-xl font-semibold tracking-tight text-text leading-snug">
            {analyst.executive.primaryCostDriver}
          </div>
          {analyst.costForecast.drivers.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {analyst.costForecast.drivers.slice(0, 3).map((d, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-text/85 leading-relaxed"
                >
                  <span className="mt-1.5 inline-block w-1 h-1 rounded-full bg-gold-500 shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Project Risk Summary ── */}
      <Section
        title="Project risk summary"
        subtitle="Synthesis of all inputs"
        icon={<Sparkles className="w-4 h-4" />}
      >
        <p className="text-sm text-text leading-relaxed">
          {analyst.riskSummary}
        </p>
        {analyst.assumptions.length > 0 && (
          <div className="mt-4 rounded-md border border-line bg-ink-800/40 px-3 py-2">
            <div className="text-xs font-medium text-muted mb-1">
              Assumptions driving this output
            </div>
            <ul className="text-xs text-muted space-y-0.5">
              {analyst.assumptions.map((a, i) => (
                <li key={i}>· {a}</li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      {/* ── Cost Breakdown + Schedule ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CostWaterfall impact={recommended} doNothingImpact={cascade.doNothing} />
        <TimelineGantt scenario={scenario} impact={recommended} />
      </div>

      {/* ── Downstream Cascade ── */}
      <CascadeGraph
        impact={recommended}
        doNothingImpact={cascade.doNothing}
      />

      {/* ── Work Package Readiness ── */}
      <Section
        title="Work package readiness"
        subtitle="Where crews can productively land right now"
        icon={<Workflow className="w-4 h-4" />}
      >
        <div className="space-y-3">
          {analyst.workPackages.map((wp, i) => (
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
                <span className={`chip border ${STATUS_TONE[wp.status].chip}`}>
                  {wp.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Resource Allocation + Top Recommended Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section
          title="Resource allocation"
          subtitle={analyst.resources.headline}
          icon={<Compass className="w-4 h-4" />}
        >
          <ol className="space-y-2.5">
            {analyst.resources.actions.map((a, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-text/90 leading-relaxed"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-500/10 text-gold-600 text-xs font-semibold">
                  {i + 1}
                </span>
                {a}
              </li>
            ))}
          </ol>
        </Section>

        <Section
          title="Top recommended actions"
          subtitle="Specific, immediate, decision-oriented"
          icon={<ListChecks className="w-4 h-4" />}
        >
          <ol className="space-y-2.5">
            {analyst.topActions.map((a, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-text/90 leading-relaxed"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-500 text-white text-xs font-semibold">
                  {i + 1}
                </span>
                {a}
              </li>
            ))}
          </ol>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 p-2 rounded-md bg-ink-800 text-muted">
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
