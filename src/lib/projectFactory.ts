import type { Scenario, Constraints } from "./types";

export const BUILT_IN_PROJECT_IDS = new Set(["mt-q3-24", "als-2024"]);

export function isBuiltInProject(id: string): boolean {
  return BUILT_IN_PROJECT_IDS.has(id);
}

export function createBlankScenario(name: string, location = "TBD"): Scenario {
  const id = `new-${Date.now()}`;
  const today = new Date().toISOString().slice(0, 10);
  const budget = 50_000_000;
  const apr = 0.075;
  const dailyCarry = Math.round((budget * apr) / 365);

  return {
    project: {
      id,
      name: name.trim() || "Untitled project",
      location: location.trim() || "TBD",
      assetClass: "Class A Office",
      totalBudgetUSD: budget,
      scheduledCompletion: addMonthsISO(today, 18),
      financingRateAPR: apr,
      dailyCarryingCostUSD: dailyCarry,
      rateLockExpiry: addMonthsISO(today, 20),
      rateLockPenaltyUSD: 1_500_000,
    },
    issue: {
      title: "Issue to be defined",
      description:
        "Describe the drawing discrepancy, field condition, or coordination conflict affecting this project.",
      location: "TBD",
      severity: "medium",
      discoveredAt: today,
    },
    cascade: [
      {
        id: `${id}-c1`,
        label: "Direct remediation",
        domain: "General",
        costUSD: 500_000,
        scheduleDays: 10,
        probability: 1,
        parents: [],
        category: "structural",
      },
      {
        id: `${id}-c2`,
        label: "Downstream coordination",
        domain: "Trades",
        costUSD: 350_000,
        scheduleDays: 7,
        probability: 0.75,
        parents: [`${id}-c1`],
        category: "mep",
      },
    ],
    solutions: [
      {
        id: "do-nothing",
        strategy: "do-nothing",
        name: "Defer decision",
        oneLiner: "Absorb risk as issues surface.",
        crewRequired: 0,
        directCostUSD: 0,
        scheduleDeltaDays: 0,
        cascadeProbabilityMultiplier: 1,
        residualRiskScore: 85,
        steps: ["No action taken."],
        requiresLongLeadMaterials: false,
      },
      {
        id: "recommended",
        strategy: "recommended",
        name: "Recommended path",
        oneLiner: "Balanced remediation and schedule recovery.",
        crewRequired: 16,
        directCostUSD: 750_000,
        scheduleDeltaDays: 8,
        cascadeProbabilityMultiplier: 0.3,
        residualRiskScore: 35,
        steps: [
          "Verify field conditions.",
          "Coordinate design response.",
          "Execute remediation per approved sequence.",
        ],
        requiresLongLeadMaterials: false,
      },
    ],
    baselineSchedule: [
      {
        id: `${id}-s1`,
        label: "Core & shell",
        startDay: 0,
        durationDays: 120,
        critical: true,
        phase: "structural",
      },
      {
        id: `${id}-s2`,
        label: "MEP rough-in",
        startDay: 90,
        durationDays: 100,
        critical: false,
        phase: "mep",
      },
      {
        id: `${id}-s3`,
        label: "Finishes",
        startDay: 180,
        durationDays: 90,
        critical: true,
        depends: [`${id}-s1`],
        phase: "finishes",
      },
    ],
  };
}

export function defaultConstraintsForProject(_id: string): Constraints {
  return {
    budgetHeadroomUSD: 3_000_000,
    crewSize: 20,
    hardDeadline: "",
    materialsConstrained: false,
    riskAppetite: 0.55,
  };
}

function addMonthsISO(iso: string, months: number): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function projectShareText(s: Scenario): string {
  return [
    `ArchImpact — ${s.project.name}`,
    `Location: ${s.project.location}`,
    `Risk: ${s.issue.severity} · ${s.issue.title}`,
    `View in dashboard: ${window.location.origin}${window.location.pathname}?project=${s.project.id}`,
  ].join("\n");
}
