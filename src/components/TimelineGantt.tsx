import type { Scenario, SolutionImpact } from "../lib/types";
import { addDays, formatDate, daysBetween } from "../lib/format";

interface Props {
  scenario: Scenario;
  impact: SolutionImpact;
}

const phaseColor: Record<string, string> = {
  structural: "#8B7355",
  mep: "#5B6B7A",
  envelope: "#B8956B",
  finishes: "#6B8F71",
  commissioning: "#C4A574",
};

export function TimelineGantt({ scenario, impact }: Props) {
  const activities = scenario.baselineSchedule;
  const totalDays = activities.reduce(
    (acc, a) => Math.max(acc, a.startDay + a.durationDays),
    0
  );
  const slipDays = Math.round(impact.netScheduleSlipDays);
  const totalWithSlip = totalDays + slipDays;

  // Computed compressed completion date for ticks
  const projectStartISO = addDays(
    scenario.project.scheduledCompletion,
    -totalDays
  );

  const ticks: { dayIdx: number; iso: string; label: string }[] = [];
  const tickCount = 5;
  for (let i = 0; i <= tickCount; i++) {
    const dayIdx = Math.round((totalWithSlip / tickCount) * i);
    const iso = addDays(projectStartISO, dayIdx);
    ticks.push({
      dayIdx,
      iso,
      label: formatDate(iso),
    });
  }

  // Rate-lock marker
  const lockDayIdx =
    totalDays + daysBetween(scenario.project.scheduledCompletion, scenario.project.rateLockExpiry);
  const lockPct = (lockDayIdx / totalWithSlip) * 100;

  // Completion marker (baseline)
  const baselineEndPct = (totalDays / totalWithSlip) * 100;

  // Slipped completion marker
  const slipEndPct = ((totalDays + slipDays) / totalWithSlip) * 100;

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Schedule</h2>
          <p className="panel-subtitle">Critical path and projected slip</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted flex-wrap">
          <LegendBar color="#8B7355" label="Structure" />
          <LegendBar color="#5B6B7A" label="MEP" />
          <LegendBar color="#B8956B" label="Envelope" />
          <LegendBar color="#6B8F71" label="Finishes" />
          <LegendBar color="#C4A574" label="Commission" />
        </div>
      </div>
      <div className="p-4">
        <div className="relative">
          {/* Critical-path slip band overlay */}
          {slipDays > 0 && (
            <div
              className="absolute top-0 bottom-6 bg-signal-red/5 border-l border-r border-signal-red/25"
              style={{
                left: `calc(${baselineEndPct}% + 88px)`,
                width: `calc(${slipEndPct - baselineEndPct}% - 0px)`,
              }}
            />
          )}

          {/* Rate-lock vertical marker */}
          <div
            className="absolute top-0 bottom-6 border-l border-dashed border-gold-500/40"
            style={{ left: `calc(${lockPct}% + 88px)` }}
            title="Rate-lock expiry"
          >
            <div className="absolute -top-3 -translate-x-1/2 text-[10px] text-gold-600 bg-ink-850 px-1">
              Rate lock
            </div>
          </div>

          {/* Activity rows */}
          <div className="space-y-1.5">
            {activities.map((a) => {
              const startPct = (a.startDay / totalWithSlip) * 100;
              const widthPct = (a.durationDays / totalWithSlip) * 100;
              return (
                <div key={a.id} className="flex items-center gap-3">
                  <div className="w-[80px] shrink-0 text-xs text-text truncate">
                    {a.label}
                  </div>
                  <div className="relative flex-1 h-5 bg-ink-800/80 rounded-sm border border-line">
                    <div
                      className="absolute top-0 bottom-0 rounded-sm"
                      style={{
                        left: `${startPct}%`,
                        width: `${widthPct}%`,
                        background: phaseColor[a.phase],
                        opacity: a.critical ? 0.95 : 0.55,
                        boxShadow: a.critical
                          ? `0 0 0 1px ${phaseColor[a.phase]}66`
                          : "none",
                      }}
                    >
                      {widthPct > 6 && (
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-medium">
                          {a.durationDays}d
                        </span>
                      )}
                    </div>
                    {a.critical && (
                      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-signal-red"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Slip overlay row */}
          {slipDays > 0 && (
            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-line/40">
              <div className="w-[80px] shrink-0 text-xs text-signal-red font-medium">
                Slip
              </div>
              <div className="relative flex-1 h-5">
                <div
                  className="absolute top-0 bottom-0 rounded-sm bg-signal-red/15 border border-signal-red/30 flex items-center justify-center"
                  style={{
                    left: `${baselineEndPct}%`,
                    width: `${slipEndPct - baselineEndPct}%`,
                  }}
                >
                  <span className="text-xs text-signal-red font-medium">
                    +{slipDays}d
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Ticks */}
          <div className="mt-3 ml-[92px] relative h-4">
            {ticks.map((t, i) => (
              <div
                key={i}
                className="absolute top-0 -translate-x-1/2 text-[10px] text-muted"
                style={{ left: `${(t.dayIdx / totalWithSlip) * 100}%` }}
              >
                {t.label}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3 text-[11px]">
          <Metric
            label="Baseline completion"
            value={formatDate(scenario.project.scheduledCompletion)}
          />
          <Metric
            label="Projected completion"
            value={formatDate(
              addDays(scenario.project.scheduledCompletion, slipDays)
            )}
            tone={slipDays > 0 ? "warn" : "neutral"}
          />
          <Metric
            label="Past rate-lock?"
            value={
              addDays(scenario.project.scheduledCompletion, slipDays) >
              scenario.project.rateLockExpiry
                ? "Yes — penalty triggered"
                : "No"
            }
            tone={
              addDays(scenario.project.scheduledCompletion, slipDays) >
              scenario.project.rateLockExpiry
                ? "bad"
                : "good"
            }
          />
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "good" | "bad" | "warn" | "neutral";
}) {
  const toneClass =
    tone === "good"
      ? "text-signal-green"
      : tone === "bad"
      ? "text-signal-red"
      : tone === "warn"
      ? "text-signal-amber"
      : "text-text";
  return (
    <div className="rounded-md bg-ink-800/50 border border-line px-3 py-2">
      <div className="text-xs text-muted">{label}</div>
      <div className={`mt-0.5 text-sm tabular-nums font-medium ${toneClass}`}>
        {value}
      </div>
    </div>
  );
}

function LegendBar({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-muted">
      <span
        className="inline-block w-3 h-1.5 rounded-sm"
        style={{ background: color }}
      />
      <span>{label}</span>
    </div>
  );
}
