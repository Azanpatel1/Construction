/**
 * AI Construction Cost & Resource Allocation Analyst
 *
 * Deterministic, rule-based engine. Takes 8 user inputs, produces an 8-section
 * risk-adjusted analysis suitable for an at-a-glance dashboard. No LLM call.
 *
 * The rules in here mirror the system prompt 1:1. Adjust the constants if you
 * want different sensitivity.
 */

export type ProjectType =
  | "Office"
  | "Healthcare"
  | "Lab / Life Sciences"
  | "Industrial / Manufacturing"
  | "Hospitality"
  | "Residential"
  | "Mixed-Use"
  | "Retail"
  | "Education"
  | "Tenant Improvement"
  | "Remodel / Renovation";

export type ProjectPhase =
  | "Pre-construction"
  | "Design Development"
  | "Permitting"
  | "Mobilization"
  | "Active Construction"
  | "Commissioning"
  | "Close-out";

export type RiskArea =
  | "Structural"
  | "Mechanical"
  | "Electrical"
  | "Plumbing"
  | "Fire Protection"
  | "Envelope / Facade"
  | "Site / Civil"
  | "Interior Finishes"
  | "Vertical Transport";

export type ResourceConstraint = "Labor" | "Materials" | "Equipment" | "Budget" | "Time";

export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export type WorkPackageStatus = "Proceed" | "Conditional" | "Hold";

export type DowntimeMechanism =
  | "Crew downtime"
  | "Equipment downtime"
  | "Procurement delay"
  | "Inspection delay"
  | "Design delay"
  | "Mixed";

export interface AnalystInput {
  description: string;
  projectType: ProjectType;
  sizeSqft: number;
  phase: ProjectPhase;
  /** 0–100 */
  drawingConfidence: number;
  riskArea: RiskArea;
  /** Free-form blocker text — empty string means "no current blocker". */
  blocker: string;
  resourceConstraint: ResourceConstraint;
}

export interface DrawingReliability {
  score: number;
  classification: "Very unreliable" | "High uncertainty" | "Moderate reliability" | "High reliability";
  implication: string;
}

export interface CostForecast {
  level: RiskLevel;
  contingencyMin: number;
  contingencyMax: number;
  drivers: string[];
  /** Short label used in the executive summary. */
  primaryCostDriver: string;
}

export interface DowntimeAssessment {
  level: RiskLevel;
  mechanism: DowntimeMechanism;
  explanation: string;
}

export interface ResourceAllocation {
  headline: string;
  actions: string[];
}

export interface WorkPackage {
  name: string;
  readiness: number;
  status: WorkPackageStatus;
  reason: string;
}

export interface ExecutiveSummary {
  overallRisk: RiskLevel;
  drawingReliability: number;
  contingencyRange: string;
  downtimeRisk: RiskLevel;
  primaryCostDriver: string;
  recommendedNextMove: string;
}

export interface AnalystOutput {
  riskSummary: string;
  drawingReliability: DrawingReliability;
  costForecast: CostForecast;
  downtime: DowntimeAssessment;
  resources: ResourceAllocation;
  workPackages: WorkPackage[];
  topActions: string[];
  executive: ExecutiveSummary;
  assumptions: string[];
}

/* ------------------------------------------------------------------ */
/* Lookups & helpers                                                   */
/* ------------------------------------------------------------------ */

const HIGH_COORD_PROJECT_TYPES: ProjectType[] = [
  "Healthcare",
  "Lab / Life Sciences",
  "Industrial / Manufacturing",
];

const HIDDEN_CONDITION_PROJECT_TYPES: ProjectType[] = [
  "Remodel / Renovation",
  "Tenant Improvement",
];

const HIGH_IMPACT_RISK_AREAS: RiskArea[] = [
  "Structural",
  "Mechanical",
  "Electrical",
  "Plumbing",
  "Fire Protection",
  "Vertical Transport",
];

const FINISH_ONLY_RISK_AREAS: RiskArea[] = ["Interior Finishes"];

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function tier(score: number, breaks: [number, number, number]): RiskLevel {
  if (score <= breaks[0]) return "Low";
  if (score <= breaks[1]) return "Medium";
  if (score <= breaks[2]) return "High";
  return "Critical";
}

/* ------------------------------------------------------------------ */
/* Section 2 — Drawing Reliability                                     */
/* ------------------------------------------------------------------ */

function evaluateDrawingReliability(confidence: number): DrawingReliability {
  const score = clamp(Math.round(confidence), 0, 100);
  let classification: DrawingReliability["classification"];
  let implication: string;

  if (score <= 30) {
    classification = "Very unreliable";
    implication =
      "Field conditions are likely to diverge sharply from the documents. Expect frequent RFIs, change orders, and rework that compounds across trades.";
  } else if (score <= 60) {
    classification = "High uncertainty";
    implication =
      "Coordination conflicts and hidden conditions are probable. Cost and schedule contingencies need to absorb meaningful rework risk.";
  } else if (score <= 80) {
    classification = "Moderate reliability";
    implication =
      "The documents are usable but spot-check the highest-risk scopes before mobilizing. Some localized rework is still expected.";
  } else {
    classification = "High reliability";
    implication =
      "Drawings can be trusted for sequencing. Rework risk is concentrated in normal coordination, not document quality.";
  }

  return { score, classification, implication };
}

function contingencyRange(confidence: number): [number, number] {
  if (confidence <= 30) return [25, 40];
  if (confidence <= 60) return [15, 30];
  if (confidence <= 80) return [10, 20];
  return [5, 10];
}

/* ------------------------------------------------------------------ */
/* Section 3 — Risk-Adjusted Cost Forecast                             */
/* ------------------------------------------------------------------ */

function evaluateCostForecast(input: AnalystInput): CostForecast {
  let score = 0;
  const drivers: string[] = [];

  // Drawing confidence
  if (input.drawingConfidence <= 30) {
    score += 3;
    drivers.push("Very low drawing confidence drives heavy rework exposure");
  } else if (input.drawingConfidence <= 60) {
    score += 2;
    drivers.push("Drawing uncertainty drives coordination and rework risk");
  } else if (input.drawingConfidence <= 80) {
    score += 1;
    drivers.push("Moderate drawing reliability introduces some rework risk");
  }

  // Project type modifiers
  if (HIGH_COORD_PROJECT_TYPES.includes(input.projectType)) {
    score += 1;
    drivers.push("High-coordination program type (MEP-intensive)");
  }
  if (HIDDEN_CONDITION_PROJECT_TYPES.includes(input.projectType)) {
    score += 1;
    drivers.push("Existing-building scope carries hidden-condition risk");
  }

  // Phase
  if (input.phase === "Active Construction") {
    score += 1;
    drivers.push("Active construction phase magnifies cost-of-discovery");
  }

  // Risk area
  if (HIGH_IMPACT_RISK_AREAS.includes(input.riskArea)) {
    score += 1;
    drivers.push(`${input.riskArea} risk has high cascade potential`);
  }
  if (FINISH_ONLY_RISK_AREAS.includes(input.riskArea)) {
    score -= 1;
  }

  // Resource constraint amplifiers
  if (input.resourceConstraint === "Budget") {
    score += 1;
    drivers.push("Budget constraint limits headroom to absorb surprises");
  }

  const level = tier(score, [1, 2, 4]);
  const [cMin, cMax] = contingencyRange(input.drawingConfidence);
  const primaryCostDriver = drivers[0] ?? "Standard project risk profile";

  return {
    level,
    contingencyMin: cMin,
    contingencyMax: cMax,
    drivers,
    primaryCostDriver,
  };
}

/* ------------------------------------------------------------------ */
/* Section 4 — Downtime Risk                                           */
/* ------------------------------------------------------------------ */

function classifyBlockerMechanism(
  blocker: string,
  riskArea: RiskArea
): DowntimeMechanism | null {
  const b = blocker.toLowerCase().trim();
  if (!b || b === "none" || b === "n/a") return null;

  const matches: DowntimeMechanism[] = [];

  if (
    /(rfi|design|drawing|conflict|clash|sketch|spec|specification|sd|cd|ifc|coordination)/.test(
      b
    )
  )
    matches.push("Design delay");
  if (
    /(material|procure|delivery|long[- ]lead|supplier|fabricat|backorder|shipment|lead time)/.test(
      b
    )
  )
    matches.push("Procurement delay");
  if (
    /(inspect|permit|ahj|approval|building official|code|sign[- ]off|cof|certificate)/.test(
      b
    )
  )
    matches.push("Inspection delay");
  if (/(crew|labor|manpower|workforce|trade|subcontractor|union|strike)/.test(b))
    matches.push("Crew downtime");
  if (/(equipment|crane|hoist|lift|forklift|machine|generator|tower)/.test(b))
    matches.push("Equipment downtime");

  if (matches.length === 0) {
    // Default by risk area when blocker text is opaque
    if (HIGH_IMPACT_RISK_AREAS.includes(riskArea)) return "Design delay";
    return "Crew downtime";
  }
  if (matches.length > 1) return "Mixed";
  return matches[0];
}

function evaluateDowntime(input: AnalystInput): DowntimeAssessment {
  const mech = classifyBlockerMechanism(input.blocker, input.riskArea);

  if (!mech) {
    return {
      level: input.phase === "Active Construction" ? "Low" : "Low",
      mechanism: "Crew downtime",
      explanation:
        "No active blocker reported. Maintain normal lookahead and verify field conditions ahead of each work package.",
    };
  }

  let score = 1; // base for having any blocker
  if (input.phase === "Active Construction") score += 2;
  else if (input.phase === "Mobilization") score += 1;
  if (input.drawingConfidence <= 60) score += 1;
  if (HIGH_IMPACT_RISK_AREAS.includes(input.riskArea)) score += 1;
  if (input.resourceConstraint === "Time") score += 1;

  const level = tier(score, [1, 2, 4]);

  const explanations: Record<DowntimeMechanism, string> = {
    "Crew downtime":
      "Crews are likely sitting idle or working out of sequence while the blocker resolves. Reassign to verified work packages to keep burn rate productive.",
    "Equipment downtime":
      "Rented or critical-path equipment is exposed to standby cost. Either redeploy or release the asset until the blocker clears.",
    "Procurement delay":
      "Material or fabrication lead-time is on the critical path. Accelerate POs and pre-stage alternate suppliers to compress the recovery window.",
    "Inspection delay":
      "An approval or sign-off is gating progress. Pre-coordinate with the AHJ and prep punch documentation in parallel to avoid a second cycle.",
    "Design delay":
      "Open RFIs or design conflicts are gating field work. Escalate the design response and identify off-critical-path work crews can shift to.",
    Mixed:
      "Blocker spans multiple categories. Triage by impact: design conflicts first, then procurement, then field readiness.",
  };

  return {
    level,
    mechanism: mech,
    explanation: explanations[mech],
  };
}

/* ------------------------------------------------------------------ */
/* Section 5 — Resource Allocation                                     */
/* ------------------------------------------------------------------ */

function evaluateResources(input: AnalystInput): ResourceAllocation {
  const actions: string[] = [];
  const lowConfidence = input.drawingConfidence < 60;
  const blockerPresent = classifyBlockerMechanism(input.blocker, input.riskArea) !== null;

  if (lowConfidence) {
    actions.push(
      `Do not fully mobilize into the ${input.riskArea} area — limit crews to verification and prep work until reliability improves.`
    );
  }
  if (blockerPresent) {
    actions.push(
      "Move crews to verified, non-blocked work packages while the blocker is resolved."
    );
  }

  switch (input.resourceConstraint) {
    case "Labor":
      actions.push(
        "Prioritize high-readiness work packages where crews can run productively without rework."
      );
      break;
    case "Materials":
      actions.push(
        "Prioritize procurement for long-lead or high-risk scopes; lock alternate suppliers for at-risk packages."
      );
      break;
    case "Equipment":
      actions.push(
        "Assign equipment to the highest-readiness tasks on the critical path; release standby gear from blocked scopes."
      );
      break;
    case "Budget":
      actions.push(
        "Focus spend on work that reduces rework risk and avoids large irreversible commitments until drawings are verified."
      );
      break;
    case "Time":
      actions.push(
        "Resolve critical-path blockers first; deploy field crews for rapid as-built verification in parallel."
      );
      break;
  }

  if (input.phase === "Active Construction" && !blockerPresent && !lowConfidence) {
    actions.push(
      "Keep current sequence; pre-build a contingency lookahead for the highest-risk scope."
    );
  }

  const headline = lowConfidence
    ? `Hold full mobilization into ${input.riskArea}. Re-route ${input.resourceConstraint.toLowerCase()} to verified packages.`
    : blockerPresent
    ? `Resolve the blocker; redeploy ${input.resourceConstraint.toLowerCase()} to ready work in the meantime.`
    : `Sustain current pace; concentrate ${input.resourceConstraint.toLowerCase()} on critical-path readiness.`;

  return { headline, actions };
}

/* ------------------------------------------------------------------ */
/* Section 6 — Work Package Readiness                                  */
/* ------------------------------------------------------------------ */

/**
 * Generate 3–5 work packages biased toward the project type and risk area.
 * Readiness is then adjusted by drawing confidence, blocker presence, and
 * whether the package sits inside the primary risk area.
 */
function generateWorkPackages(input: AnalystInput): WorkPackage[] {
  const inRiskArea = (area: RiskArea | "Verified" | "Non-risk"): boolean =>
    area === input.riskArea;

  // Domain-aware default packages keyed off risk area.
  const templates: { name: string; area: RiskArea | "Non-risk" | "Verified" }[] = [];

  switch (input.riskArea) {
    case "Structural":
      templates.push(
        { name: "Foundation completion / pile cap closeout", area: "Verified" },
        { name: "Affected structural framing / column line", area: "Structural" },
        { name: "Adjacent slab pour outside affected grid", area: "Non-risk" },
        { name: "Steel detailing & shop drawing review", area: "Structural" }
      );
      break;
    case "Mechanical":
      templates.push(
        { name: "Mechanical room rough-in (affected zone)", area: "Mechanical" },
        { name: "MEP coordination drawings (BIM clash run)", area: "Mechanical" },
        { name: "Plumbing rough-in (non-affected zones)", area: "Non-risk" },
        { name: "AHU and chiller submittals", area: "Mechanical" }
      );
      break;
    case "Electrical":
      templates.push(
        { name: "Main distribution gear set", area: "Electrical" },
        { name: "Branch rough-in (verified zones)", area: "Non-risk" },
        { name: "Switchgear coordination study", area: "Electrical" },
        { name: "Fire alarm rough-in (non-affected zones)", area: "Non-risk" }
      );
      break;
    case "Plumbing":
      templates.push(
        { name: "Underground sanitary / storm rough-in", area: "Plumbing" },
        { name: "Above-ground branch (verified zones)", area: "Non-risk" },
        { name: "Fixture submittal & cut-sheet release", area: "Plumbing" },
        { name: "Domestic water riser pressure test", area: "Plumbing" }
      );
      break;
    case "Fire Protection":
      templates.push(
        { name: "Main standpipe and riser install", area: "Fire Protection" },
        { name: "Sprinkler branch lines (verified zones)", area: "Non-risk" },
        { name: "Sprinkler shop drawing review", area: "Fire Protection" },
        { name: "Fire pump test & inspection prep", area: "Fire Protection" }
      );
      break;
    case "Envelope / Facade":
      templates.push(
        { name: "Curtain wall mockup performance test", area: "Envelope / Facade" },
        { name: "Affected facade panel survey", area: "Envelope / Facade" },
        { name: "Interior framing behind verified facade", area: "Non-risk" },
        { name: "Roofing membrane install", area: "Non-risk" }
      );
      break;
    case "Site / Civil":
      templates.push(
        { name: "Site utilities — verified runs", area: "Non-risk" },
        { name: "Earthwork in affected zone", area: "Site / Civil" },
        { name: "Stormwater management compliance", area: "Site / Civil" },
        { name: "Hardscape and curb work", area: "Non-risk" }
      );
      break;
    case "Vertical Transport":
      templates.push(
        { name: "Elevator shaft alignment survey", area: "Vertical Transport" },
        { name: "Adjacent core construction (verified)", area: "Non-risk" },
        { name: "Elevator submittal & cab finish package", area: "Vertical Transport" },
        { name: "Hoistway MEP rough-in", area: "Vertical Transport" }
      );
      break;
    case "Interior Finishes":
    default:
      templates.push(
        { name: "Drywall and ceiling rough-in (verified)", area: "Non-risk" },
        { name: "Affected finish-out scope", area: "Interior Finishes" },
        { name: "Millwork shop drawings", area: "Interior Finishes" },
        { name: "Paint & flooring sequencing", area: "Non-risk" }
      );
      break;
  }

  // Project type tweak: programs with heavy MEP coordination add a coordination
  // verification package.
  if (HIGH_COORD_PROJECT_TYPES.includes(input.projectType)) {
    templates.push({
      name: "Lab/clinical MEP zoning verification",
      area: "Mechanical",
    });
  }

  // Score each package.
  const blockerPresent = classifyBlockerMechanism(input.blocker, input.riskArea) !== null;
  const confidence = clamp(input.drawingConfidence, 0, 100);

  const packages: WorkPackage[] = templates.slice(0, 5).map((t) => {
    const isRisk = t.area === input.riskArea;
    const isVerified = t.area === "Verified" || t.area === "Non-risk";

    // Start from confidence; verified packages get a floor uplift, risk-area
    // packages get a penalty.
    let r = Math.round(confidence);
    if (isVerified) r += 15;
    if (isRisk) r -= 25;
    if (blockerPresent && (isRisk || t.area === "Verified")) {
      r -= 15;
    } else if (blockerPresent) {
      r -= 5;
    }
    if (input.phase === "Active Construction" && isVerified) r += 5;
    if (input.phase === "Pre-construction" || input.phase === "Design Development")
      r -= 10;

    r = clamp(r, 0, 100);

    const status: WorkPackageStatus =
      r >= 80 ? "Proceed" : r >= 60 ? "Conditional" : "Hold";

    let reason: string;
    if (isRisk) {
      reason = "Inside the primary risk area; verify field conditions before mobilizing.";
    } else if (isVerified) {
      reason = blockerPresent
        ? "Outside the blocker — productive landing spot for redeployed crews."
        : "Verified scope clear of risk drivers.";
    } else {
      reason =
        confidence < 60
          ? "Drawing confidence limits crew productivity until reliability improves."
          : "Standard readiness; coordinate with adjacent scopes.";
    }

    return { name: t.name, readiness: r, status, reason };
  });

  return packages;
}

/* ------------------------------------------------------------------ */
/* Section 1 & 7 & 8 — Summary, Actions, Executive                     */
/* ------------------------------------------------------------------ */

function buildRiskSummary(
  input: AnalystInput,
  reliability: DrawingReliability,
  cost: CostForecast,
  downtime: DowntimeAssessment
): string {
  const blockerNoun = input.blocker.trim() ? "an active blocker" : "no active blocker";
  const sizeNote = input.sizeSqft
    ? `the ${input.sizeSqft.toLocaleString()} sq ft `
    : "the ";

  const part1 = `Overall risk reads ${cost.level.toLowerCase()} on ${sizeNote}${input.projectType.toLowerCase()} project during ${input.phase.toLowerCase()}.`;
  const part2 = `Drawing confidence at ${reliability.score}% (${reliability.classification.toLowerCase()}) is the dominant uncertainty, with the ${input.riskArea.toLowerCase()} scope sitting on the critical path.`;
  const part3 = `${blockerNoun.charAt(0).toUpperCase() + blockerNoun.slice(1)} combined with a ${input.resourceConstraint.toLowerCase()} constraint shapes the near-term play.`;
  const part4 =
    cost.level === "Critical" || downtime.level === "Critical"
      ? "Inputs suggest immediate intervention is warranted, though precise cost impact cannot be quantified from these inputs alone."
      : "";

  return [part1, part2, part3, part4].filter(Boolean).join(" ");
}

function topActions(
  input: AnalystInput,
  reliability: DrawingReliability,
  cost: CostForecast,
  downtime: DowntimeAssessment,
  resources: ResourceAllocation
): string[] {
  const actions: string[] = [];

  if (reliability.score < 60) {
    actions.push(
      `Commission a 1-week field verification sweep of the ${input.riskArea.toLowerCase()} scope before any additional mobilization.`
    );
  }
  if (downtime.level === "High" || downtime.level === "Critical") {
    actions.push(
      `Escalate the active blocker today — assign a single accountable owner with a 48-hour resolution target.`
    );
  }
  if (cost.level === "High" || cost.level === "Critical") {
    actions.push(
      `Lock in a ${cost.contingencyMin}–${cost.contingencyMax}% contingency reserve with the lender / owner before next change order cycle.`
    );
  }
  // Always pull the top resource recommendation in
  if (resources.actions[0]) {
    actions.push(resources.actions[0]);
  }
  if (HIGH_COORD_PROJECT_TYPES.includes(input.projectType) && reliability.score < 80) {
    actions.push(
      "Run a BIM clash detection pass on the affected zone and republish coordination drawings."
    );
  }
  if (HIDDEN_CONDITION_PROJECT_TYPES.includes(input.projectType)) {
    actions.push(
      "Schedule destructive probes on suspect existing conditions before finalizing scope."
    );
  }
  if (actions.length < 3) {
    actions.push(
      "Lock the next 2-week lookahead with verified-only work and pre-stage materials."
    );
  }

  return actions.slice(0, 5);
}

function recommendedNextMove(
  input: AnalystInput,
  reliability: DrawingReliability,
  cost: CostForecast,
  downtime: DowntimeAssessment
): string {
  if (reliability.score < 30) {
    return `Pause new commitments in ${input.riskArea.toLowerCase()} and order a field verification sweep before resuming.`;
  }
  if (downtime.level === "Critical") {
    return `Treat the blocker as a single-owner emergency item; redeploy crews to verified packages within 24 hours.`;
  }
  if (downtime.level === "High") {
    return `Resolve the active blocker this week; in parallel, shift crews to high-readiness packages.`;
  }
  if (cost.level === "Critical" || cost.level === "High") {
    return `Lock in a ${cost.contingencyMin}–${cost.contingencyMax}% contingency and tighten lookahead controls before the next change-order window.`;
  }
  if (reliability.score < 60) {
    return `Run a verification pass on the ${input.riskArea.toLowerCase()} scope before mobilizing additional crews.`;
  }
  return `Maintain pace; reinforce coordination on the ${input.riskArea.toLowerCase()} scope as a precaution.`;
}

function overallRisk(cost: CostForecast, downtime: DowntimeAssessment): RiskLevel {
  // Take the worse of the two.
  const order: RiskLevel[] = ["Low", "Medium", "High", "Critical"];
  const a = order.indexOf(cost.level);
  const b = order.indexOf(downtime.level);
  return order[Math.max(a, b)];
}

function gatherAssumptions(input: AnalystInput): string[] {
  const assumptions: string[] = [];
  if (!input.description.trim()) {
    assumptions.push("No project description provided — using project type defaults.");
  }
  if (!input.sizeSqft || input.sizeSqft <= 0) {
    assumptions.push("Project size not provided — analysis is sized-agnostic.");
  }
  if (!input.blocker.trim()) {
    assumptions.push("No current blocker reported — assuming standard field conditions.");
  }
  return assumptions;
}

/* ------------------------------------------------------------------ */
/* Public entry point                                                  */
/* ------------------------------------------------------------------ */

export function runAnalyst(input: AnalystInput): AnalystOutput {
  const drawingReliability = evaluateDrawingReliability(input.drawingConfidence);
  const costForecast = evaluateCostForecast(input);
  const downtime = evaluateDowntime(input);
  const resources = evaluateResources(input);
  const workPackages = generateWorkPackages(input);
  const riskSummary = buildRiskSummary(input, drawingReliability, costForecast, downtime);
  const actions = topActions(input, drawingReliability, costForecast, downtime, resources);

  const exec: ExecutiveSummary = {
    overallRisk: overallRisk(costForecast, downtime),
    drawingReliability: drawingReliability.score,
    contingencyRange: `${costForecast.contingencyMin}–${costForecast.contingencyMax}%`,
    downtimeRisk: downtime.level,
    primaryCostDriver: costForecast.primaryCostDriver,
    recommendedNextMove: recommendedNextMove(input, drawingReliability, costForecast, downtime),
  };

  return {
    riskSummary,
    drawingReliability,
    costForecast,
    downtime,
    resources,
    workPackages,
    topActions: actions,
    executive: exec,
    assumptions: gatherAssumptions(input),
  };
}

/* ------------------------------------------------------------------ */
/* Defaults                                                            */
/* ------------------------------------------------------------------ */

export const DEFAULT_ANALYST_INPUT: AnalystInput = {
  description:
    "Floor 14 column grid offset 18 inches from structural drawings on a 600,000 sq ft hospitality tower under active construction.",
  projectType: "Hospitality",
  sizeSqft: 600_000,
  phase: "Active Construction",
  drawingConfidence: 55,
  riskArea: "Structural",
  blocker:
    "Open RFI on column reframe; pending structural EOR response and Chicago DOB permit revision.",
  resourceConstraint: "Time",
};
