import type { Scenario } from "./types";

/**
 * IB-relevant demo scenarios. Numbers are calibrated to feel plausible for
 * a Class-A office tower or mixed-use development in a tier-1 US market.
 *
 * Calibration anchors:
 *   - Daily carrying cost on $600M drawn @ 7.25% APR ≈ $119K/day.
 *   - Rate-lock break fees on hedged construction debt commonly run 1-2% of
 *     notional for missed expiry windows.
 *   - Structural rework on a single floor of a 40-floor tower: $1.5–3M
 *     range depending on what's already poured.
 *   - Carrying cost dominates beyond ~30 days of slip — this is the lesson
 *     judges should walk away with.
 */

export const marriottTower: Scenario = {
  project: {
    id: "mt-q3-24",
    name: "Marriott Tower — 1101 Wabash",
    location: "Chicago, IL",
    assetClass: "Hospitality",
    totalBudgetUSD: 612_000_000,
    scheduledCompletion: "2027-04-15",
    financingRateAPR: 0.0725,
    dailyCarryingCostUSD: 119_000,
    rateLockExpiry: "2027-06-30",
    rateLockPenaltyUSD: 4_800_000,
  },
  issue: {
    title: "Floor 14 column grid misalignment",
    description:
      "Field survey discovered the column grid on floor 14 is offset 18 inches " +
      "from the structural drawings. Affects load path for floors 15–24 and " +
      "elevator shaft 2. Architect of Record confirms drawing error, not field error.",
    location: "Floor 14, Cores B & C",
    severity: "high",
    discoveredAt: "2026-05-12",
    drawingPreviewURL: undefined,
  },
  cascade: [
    {
      id: "n1-structural-rework",
      label: "Structural rework — floor 14 columns",
      domain: "Structural",
      costUSD: 2_100_000,
      scheduleDays: 14,
      probability: 1.0, // certain if we don't intervene
      parents: [],
      category: "structural",
    },
    {
      id: "n2-mep-rerouting",
      label: "MEP risers rerouted floors 14–24",
      domain: "MEP",
      costUSD: 1_650_000,
      scheduleDays: 9,
      probability: 0.95,
      parents: ["n1-structural-rework"],
      category: "mep",
    },
    {
      id: "n3-elevator-shaft",
      label: "Elevator shaft 2 realignment",
      domain: "Vertical Transport",
      costUSD: 920_000,
      scheduleDays: 11,
      probability: 0.8,
      parents: ["n1-structural-rework"],
      category: "structural",
    },
    {
      id: "n4-curtainwall",
      label: "Curtain wall remeasure — floors 14–18",
      domain: "Envelope",
      costUSD: 740_000,
      scheduleDays: 6,
      probability: 0.7,
      parents: ["n1-structural-rework"],
      category: "finishes",
    },
    {
      id: "n5-permit-revision",
      label: "Permit revision filing (Chicago DOB)",
      domain: "Regulatory",
      costUSD: 180_000,
      scheduleDays: 12,
      probability: 0.85,
      parents: ["n1-structural-rework"],
      category: "regulatory",
    },
    {
      id: "n6-change-orders",
      label: "GC change orders + mark-up",
      domain: "Contracts",
      costUSD: 580_000,
      scheduleDays: 0,
      probability: 0.95,
      parents: ["n2-mep-rerouting", "n3-elevator-shaft"],
      category: "financing",
    },
    {
      id: "n7-ratelock-risk",
      label: "Construction loan rate-lock at risk",
      domain: "Financing",
      costUSD: 4_800_000,
      scheduleDays: 0,
      probability: 0.6,
      parents: ["n5-permit-revision", "n3-elevator-shaft"],
      category: "financing",
    },
    {
      id: "n8-brand-penalty",
      label: "Marriott key-date opening penalty",
      domain: "Operator",
      costUSD: 1_900_000,
      scheduleDays: 0,
      probability: 0.45,
      parents: ["n7-ratelock-risk"],
      category: "financing",
    },
  ],
  solutions: [
    {
      id: "do-nothing",
      strategy: "do-nothing",
      name: "Defer decision",
      oneLiner: "Continue current sequence; absorb cascade as it surfaces.",
      crewRequired: 0,
      directCostUSD: 0,
      scheduleDeltaDays: 0,
      cascadeProbabilityMultiplier: 1.0,
      residualRiskScore: 92,
      steps: [
        "No remediation action taken.",
        "Each downstream impact handled reactively as it surfaces.",
        "Carrying costs accrue at full daily rate.",
      ],
      requiresLongLeadMaterials: false,
    },
    {
      id: "conservative",
      strategy: "conservative",
      name: "Conservative — sequential remediation",
      oneLiner:
        "Stop work on floors 15+, fully resolve floor 14 before resuming. Lowest residual risk, highest schedule slip.",
      crewRequired: 18,
      directCostUSD: 2_950_000,
      scheduleDeltaDays: 26,
      cascadeProbabilityMultiplier: 0.15,
      residualRiskScore: 22,
      steps: [
        "Issue stop-work order on floors 15+ effective immediately.",
        "Re-engineer column grid with SOM; resubmit to Chicago DOB.",
        "Sequential MEP and curtain wall remeasure post-structural sign-off.",
        "Resume vertical construction with verified as-builts.",
      ],
      requiresLongLeadMaterials: false,
    },
    {
      id: "recommended",
      strategy: "recommended",
      name: "Recommended — reframe + parallel MEP",
      oneLiner:
        "Reframe floor 14 in place while MEP coordinates parallel. Balanced cost-schedule profile.",
      crewRequired: 24,
      directCostUSD: 3_650_000,
      scheduleDeltaDays: 11,
      cascadeProbabilityMultiplier: 0.25,
      residualRiskScore: 38,
      steps: [
        "Engage structural EOR to design in-place reframe (no demo of floor 15+).",
        "Parallel-track MEP coordination using BIM clash detection on revised model.",
        "File Chicago DOB revision under expedited 14-day review.",
        "Curtain wall remeasure only on floors 14–15 (delta band).",
      ],
      requiresLongLeadMaterials: false,
    },
    {
      id: "aggressive",
      strategy: "aggressive",
      name: "Aggressive — accelerated workaround",
      oneLiner:
        "Field-modify column caps + bracket transitions; pour ahead. Fastest path, accepts elevated regulatory risk.",
      crewRequired: 32,
      directCostUSD: 4_950_000,
      scheduleDeltaDays: 4,
      cascadeProbabilityMultiplier: 0.45,
      residualRiskScore: 64,
      steps: [
        "Engineered transition brackets fabricated off-site (long-lead).",
        "Continue vertical construction floors 15+ in parallel.",
        "Post-installation third-party load testing on floor 14.",
        "Permit revision filed concurrent with construction (regulatory exposure).",
      ],
      requiresLongLeadMaterials: true,
    },
  ],
  baselineSchedule: [
    { id: "s1", label: "Foundation + podium", startDay: 0, durationDays: 90, critical: true, phase: "structural" },
    { id: "s2", label: "Vertical structure F1–F13", startDay: 80, durationDays: 140, critical: true, depends: ["s1"], phase: "structural" },
    { id: "s3", label: "Vertical structure F14–F28", startDay: 215, durationDays: 160, critical: true, depends: ["s2"], phase: "structural" },
    { id: "s4", label: "MEP rough-in", startDay: 180, durationDays: 200, critical: false, phase: "mep" },
    { id: "s5", label: "Curtain wall install", startDay: 280, durationDays: 180, critical: true, depends: ["s3"], phase: "envelope" },
    { id: "s6", label: "Interior finishes", startDay: 380, durationDays: 220, critical: true, depends: ["s5"], phase: "finishes" },
    { id: "s7", label: "Commissioning + handover", startDay: 580, durationDays: 60, critical: true, depends: ["s6"], phase: "commissioning" },
  ],
};

export const allScenarios: Scenario[] = [marriottTower];

export const defaultConstraints = {
  marriottTower: {
    budgetHeadroomUSD: 5_000_000,
    crewSize: 28,
    hardDeadline: "2027-05-30",
    materialsConstrained: false,
    riskAppetite: 0.6,
  },
};
