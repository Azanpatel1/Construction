import { useMemo, useState } from "react";
import type { CascadeNodeImpact, SolutionImpact } from "../lib/types";
import { categoryColor, formatPct, formatUSD } from "../lib/format";

interface Props {
  impact: SolutionImpact;
  doNothingImpact: SolutionImpact;
}

interface PositionedNode {
  impact: CascadeNodeImpact;
  doNothing: CascadeNodeImpact;
  x: number;
  y: number;
  depth: number;
}

/**
 * Lays out the cascade DAG by computing depth (longest path from root) and
 * spreading nodes within each depth column.
 */
function layoutCascade(
  impacts: CascadeNodeImpact[],
  doNothingImpacts: CascadeNodeImpact[],
  width: number,
  height: number
): { nodes: PositionedNode[]; depthCount: number } {
  const dnById = new Map(doNothingImpacts.map((d) => [d.node.id, d]));
  const depthMap = new Map<string, number>();
  const byId = new Map(impacts.map((i) => [i.node.id, i]));

  function depth(id: string): number {
    const cached = depthMap.get(id);
    if (cached !== undefined) return cached;
    const node = byId.get(id)?.node;
    if (!node || node.parents.length === 0) {
      depthMap.set(id, 0);
      return 0;
    }
    const d = 1 + Math.max(...node.parents.map((p) => depth(p)));
    depthMap.set(id, d);
    return d;
  }
  impacts.forEach((i) => depth(i.node.id));

  const depthCount = Math.max(...depthMap.values()) + 1;
  const columnW = width / Math.max(depthCount, 1);

  // Bucket nodes by depth
  const buckets: CascadeNodeImpact[][] = Array.from(
    { length: depthCount },
    () => []
  );
  for (const i of impacts) buckets[depthMap.get(i.node.id) ?? 0].push(i);

  const nodes: PositionedNode[] = [];
  buckets.forEach((bucket, di) => {
    const slotH = height / Math.max(bucket.length, 1);
    bucket.forEach((imp, j) => {
      nodes.push({
        impact: imp,
        doNothing: dnById.get(imp.node.id)!,
        depth: di,
        x: columnW * di + columnW / 2,
        y: slotH * j + slotH / 2,
      });
    });
  });

  return { nodes, depthCount };
}

export function CascadeGraph({ impact, doNothingImpact }: Props) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const WIDTH = 720;
  const HEIGHT = 360;

  const { nodes } = useMemo(
    () =>
      layoutCascade(
        impact.nodeImpacts,
        doNothingImpact.nodeImpacts,
        WIDTH,
        HEIGHT
      ),
    [impact, doNothingImpact]
  );

  const byId = new Map(nodes.map((n) => [n.impact.node.id, n]));

  // Aggregate expected downstream by category for the side panel
  const byCategory = useMemo(() => {
    const m: Record<string, { cost: number; days: number }> = {};
    impact.nodeImpacts.forEach((n) => {
      const cat = n.node.category;
      if (!m[cat]) m[cat] = { cost: 0, days: 0 };
      m[cat].cost += n.expectedCostUSD;
      m[cat].days += n.expectedScheduleDays;
    });
    return Object.entries(m)
      .map(([k, v]) => ({ category: k, ...v }))
      .sort((a, b) => b.cost - a.cost);
  }, [impact]);

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Downstream cascade</h2>
          <p className="panel-subtitle">Hover a node for impact detail</p>
        </div>
        <div className="text-xs text-muted">
          {impact.nodeImpacts.length} nodes · {countEdges(impact)} edges
        </div>
      </div>
      <div className="p-4 grid grid-cols-[1fr_220px] gap-4">
        <div className="relative bg-ink-800/40 rounded-md border border-line overflow-hidden">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-[360px]"
          >
            {/* Edges */}
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#8A8580" />
              </marker>
              <marker
                id="arrow-hot"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#C45C4A" />
              </marker>
            </defs>
            {nodes.flatMap((n) =>
              n.impact.node.parents.map((pid) => {
                const p = byId.get(pid);
                if (!p) return null;
                const probColor = edgeColor(n.impact.effectiveProbability);
                const isHot =
                  hoverId === n.impact.node.id || hoverId === pid;
                const strokeWidth = 1 + n.impact.effectiveProbability * 2.5;
                return (
                  <g key={`${pid}-${n.impact.node.id}`}>
                    <path
                      d={curvedPath(p.x, p.y, n.x, n.y)}
                      stroke={isHot ? "#C45C4A" : probColor}
                      strokeWidth={isHot ? strokeWidth + 1 : strokeWidth}
                      fill="none"
                      markerEnd={isHot ? "url(#arrow-hot)" : "url(#arrow)"}
                      opacity={isHot ? 1 : 0.55}
                    />
                  </g>
                );
              })
            )}

            {/* Nodes */}
            {nodes.map((n) => {
              const c = categoryColor(n.impact.node.category);
              const r = 6 + n.impact.effectiveProbability * 14;
              const dimmed = hoverId && hoverId !== n.impact.node.id;
              return (
                <g
                  key={n.impact.node.id}
                  transform={`translate(${n.x}, ${n.y})`}
                  onMouseEnter={() => setHoverId(n.impact.node.id)}
                  onMouseLeave={() => setHoverId(null)}
                  className="cursor-pointer"
                  opacity={dimmed ? 0.35 : 1}
                >
                  <circle
                    r={r + 4}
                    fill={c}
                    opacity={0.12}
                  />
                  <circle
                    r={r}
                    fill={c}
                    fillOpacity={0.85}
                    stroke={c}
                    strokeWidth={1.5}
                  />
                  <text
                    y={r + 14}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#2C2A28"
                    fontFamily="DM Sans, sans-serif"
                  >
                    {truncate(n.impact.node.label, 26)}
                  </text>
                  <text
                    y={r + 26}
                    textAnchor="middle"
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                    fill="#8A8580"
                  >
                    p={formatPct(n.impact.effectiveProbability)} ·{" "}
                    {formatUSD(n.impact.expectedCostUSD)}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover detail popover */}
          {hoverId && (() => {
            const n = byId.get(hoverId)!;
            const reductionPct =
              n.doNothing.effectiveProbability > 0
                ? 1 - n.impact.effectiveProbability / n.doNothing.effectiveProbability
                : 0;
            return (
              <div className="absolute top-3 left-3 right-3 rounded-md border border-line bg-ink-850/95 backdrop-blur-sm px-3 py-2 shadow-soft pointer-events-none">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-text">
                    {n.impact.node.label}
                  </span>
                  <span
                    className="chip border"
                    style={{
                      color: categoryColor(n.impact.node.category),
                      borderColor: `${categoryColor(n.impact.node.category)}55`,
                      background: `${categoryColor(n.impact.node.category)}11`,
                    }}
                  >
                    {n.impact.node.category}
                  </span>
                </div>
                <div className="mt-1 grid grid-cols-3 gap-3 text-[10px] font-mono">
                  <div>
                    <div className="text-muted">Probability</div>
                    <div className="text-text">
                      {formatPct(n.impact.effectiveProbability, 1)}{" "}
                      <span className="text-signal-green">
                        ↓ {formatPct(reductionPct)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-muted">Expected cost</div>
                    <div className="text-text">
                      {formatUSD(n.impact.expectedCostUSD)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted">Expected slip</div>
                    <div className="text-text">
                      {n.impact.expectedScheduleDays.toFixed(1)}d
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Category breakdown */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted">
            By domain
          </div>
          {byCategory.map((c) => {
            const max = byCategory[0].cost;
            const pct = max > 0 ? (c.cost / max) * 100 : 0;
            const color = categoryColor(c.category as any);
            return (
              <div key={c.category}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text/90 capitalize">{c.category}</span>
                  <span className="font-mono tabular-nums text-text">
                    {formatUSD(c.cost)}
                  </span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-ink-800 overflow-hidden">
                  <div
                    className="h-full"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function curvedPath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

function edgeColor(prob: number): string {
  if (prob > 0.5) return "#C45C4A";
  if (prob > 0.25) return "#B8956B";
  return "#D4CFC6";
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function countEdges(impact: SolutionImpact): number {
  return impact.nodeImpacts.reduce(
    (acc, n) => acc + n.node.parents.length,
    0
  );
}
