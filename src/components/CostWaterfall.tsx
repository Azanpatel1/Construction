import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SolutionImpact } from "../lib/types";
import { formatUSD } from "../lib/format";

interface Props {
  impact: SolutionImpact;
  doNothingImpact: SolutionImpact;
}

interface Bucket {
  name: string;
  fromUSD: number;
  toUSD: number;
  /** Magnitude for the bar (toUSD - fromUSD). */
  valueUSD: number;
  /** "increase" | "decrease" | "total" | "savings" */
  kind: "increase" | "decrease" | "total" | "savings";
}

export function CostWaterfall({ impact, doNothingImpact }: Props) {
  const data = useMemo(() => buildBuckets(impact, doNothingImpact), [
    impact,
    doNothingImpact,
  ]);
  const maxY = Math.max(...data.map((d) => d.toUSD));

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Cost breakdown</h2>
          <p className="panel-subtitle">Direct fix, cascade, and financing</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted">
          <LegendDot color="#C45C4A" label="Outflow" />
          <LegendDot color="#4A7C59" label="Savings" />
          <LegendDot color="#B85C38" label="Total" />
        </div>
      </div>
      <div className="p-4 pt-2 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 24, right: 16, bottom: 24, left: 8 }}
          >
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              interval={0}
              tick={{ fontSize: 11, fill: "#8A8580" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatUSD(v)}
              domain={[0, Math.ceil(maxY * 1.15)]}
              tick={{ fontSize: 11, fill: "#8A8580" }}
            />
            <Tooltip
              cursor={{ fill: "rgba(184,92,56,0.06)" }}
              content={<WaterfallTooltip />}
            />
            {/* Invisible "from" base */}
            <Bar dataKey="fromUSD" stackId="a" fill="transparent" />
            <Bar dataKey="valueUSD" stackId="a" radius={[3, 3, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={colorForKind(d.kind)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function buildBuckets(
  impact: SolutionImpact,
  doNothing: SolutionImpact
): Bucket[] {
  const buckets: Bucket[] = [];
  let running = 0;

  // 1) Direct remediation cost
  if (impact.directCostUSD > 0) {
    buckets.push({
      name: "Direct fix",
      fromUSD: running,
      toUSD: running + impact.directCostUSD,
      valueUSD: impact.directCostUSD,
      kind: "increase",
    });
    running += impact.directCostUSD;
  }

  // 2) Expected downstream cost (cascade)
  buckets.push({
    name: "Downstream cascade",
    fromUSD: running,
    toUSD: running + impact.expectedDownstreamCostUSD,
    valueUSD: impact.expectedDownstreamCostUSD,
    kind: "increase",
  });
  running += impact.expectedDownstreamCostUSD;

  // 3) Carrying cost
  if (impact.carryingCostUSD > 0) {
    buckets.push({
      name: "Capital carry",
      fromUSD: running,
      toUSD: running + impact.carryingCostUSD,
      valueUSD: impact.carryingCostUSD,
      kind: "increase",
    });
    running += impact.carryingCostUSD;
  }

  // 4) Rate lock penalty
  if (impact.rateLockPenaltyUSD > 0) {
    buckets.push({
      name: "Rate-lock penalty",
      fromUSD: running,
      toUSD: running + impact.rateLockPenaltyUSD,
      valueUSD: impact.rateLockPenaltyUSD,
      kind: "increase",
    });
    running += impact.rateLockPenaltyUSD;
  }

  // 5) Total
  buckets.push({
    name: "Total impact",
    fromUSD: 0,
    toUSD: running,
    valueUSD: running,
    kind: "total",
  });

  // 6) Savings vs do-nothing
  const savings = doNothing.totalImpactUSD - impact.totalImpactUSD;
  if (savings > 0) {
    buckets.push({
      name: "Avoided loss",
      fromUSD: 0,
      toUSD: savings,
      valueUSD: savings,
      kind: "savings",
    });
  }

  return buckets;
}

function colorForKind(kind: Bucket["kind"]): string {
  switch (kind) {
    case "increase":
      return "#C45C4A";
    case "decrease":
      return "#4A7C59";
    case "total":
      return "#B85C38";
    case "savings":
      return "#4A7C59";
  }
}

function WaterfallTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0]?.payload as Bucket | undefined;
  if (!d) return null;
  return (
    <div className="rounded-md border border-line bg-ink-850 px-3 py-2 shadow-soft">
      <div className="text-xs text-muted">{d.name}</div>
      <div className="mt-0.5 text-sm tabular-nums text-text font-medium">
        {formatUSD(d.valueUSD, { compact: false })}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-muted">
      <span
        className="inline-block w-2 h-2 rounded-sm"
        style={{ background: color }}
      />
      <span>{label}</span>
    </div>
  );
}
