export type AssetClass =
  | "Class A Office"
  | "Mixed-Use Tower"
  | "Hospitality"
  | "Industrial"
  | "Multifamily";

export type Severity = "low" | "medium" | "high" | "critical";

export interface ProjectMeta {
  id: string;
  name: string;
  location: string;
  assetClass: AssetClass;
  totalBudgetUSD: number;
  scheduledCompletion: string;
  /** Annualized debt cost on drawn capital. */
  financingRateAPR: number;
  /** Daily carrying cost = (drawnCapital * APR / 365) — precomputed for the demo. */
  dailyCarryingCostUSD: number;
  /** Date the rate-lock expires. Slipping past it triggers a refinancing penalty. */
  rateLockExpiry: string;
  rateLockPenaltyUSD: number;
}

export interface IssueInput {
  /** Short headline. */
  title: string;
  description: string;
  location: string;
  severity: Severity;
  /** Free-form discovered date, ISO. */
  discoveredAt: string;
  /** Optional placeholder for a drawing thumbnail. */
  drawingPreviewURL?: string;
}

/**
 * A node in the downstream cascade. Each node represents a discrete impact
 * triggered (probabilistically) by the upstream issue or another node.
 */
export interface CascadeNode {
  id: string;
  label: string;
  /** Trade / discipline affected (Structural, MEP, Finishes, Financing, etc.). */
  domain: string;
  /** Direct cost in USD if this node materializes. */
  costUSD: number;
  /** Schedule impact in days added to critical path if it materializes. */
  scheduleDays: number;
  /** Probability this cascades from its parent, 0..1. */
  probability: number;
  /** Upstream parents (ids). Empty array == root cause. */
  parents: string[];
  /** Risk category for color coding. */
  category: "structural" | "mep" | "finishes" | "financing" | "regulatory" | "schedule";
}

export interface Constraints {
  /** Additional budget the firm is willing to deploy, USD. */
  budgetHeadroomUSD: number;
  /** Crew size available for remediation, FTE. */
  crewSize: number;
  /** Hard deadline (ISO). Empty = use scheduled completion. */
  hardDeadline: string;
  /** Whether materials lead-times are constrained. */
  materialsConstrained: boolean;
  /** Risk appetite — lower means we discount risky savings more heavily. */
  riskAppetite: number; // 0..1
}

export type SolutionStrategy =
  | "do-nothing"
  | "conservative"
  | "recommended"
  | "aggressive";

export interface SolutionPlan {
  id: string;
  strategy: SolutionStrategy;
  name: string;
  oneLiner: string;
  /** Crew required to execute. */
  crewRequired: number;
  /** Upfront / direct remediation cost. */
  directCostUSD: number;
  /** Schedule impact in days vs. the original baseline (positive = slip). */
  scheduleDeltaDays: number;
  /** Multiplier applied to each downstream node's probability. */
  cascadeProbabilityMultiplier: number;
  /** Residual risk score, 0..100. */
  residualRiskScore: number;
  /** Bulleted execution steps. */
  steps: string[];
  /** Whether materials lead-time is a blocker for this option. */
  requiresLongLeadMaterials: boolean;
}

export interface Scenario {
  project: ProjectMeta;
  issue: IssueInput;
  cascade: CascadeNode[];
  solutions: SolutionPlan[];
  /** Baseline timeline activities for the gantt. */
  baselineSchedule: ScheduleActivity[];
}

export interface ScheduleActivity {
  id: string;
  label: string;
  /** Day offset from project T0 (days, 0-indexed). */
  startDay: number;
  durationDays: number;
  /** Whether on the critical path. */
  critical: boolean;
  /** Optional dependency ids. */
  depends?: string[];
  /** Phase grouping for color. */
  phase: "structural" | "mep" | "envelope" | "finishes" | "commissioning";
}

/* ------------------------------------------------------------------ */
/* Computed analysis output                                            */
/* ------------------------------------------------------------------ */

export interface CascadeNodeImpact {
  node: CascadeNode;
  /** Effective probability after upstream chain and chosen solution. */
  effectiveProbability: number;
  /** Expected cost = probability * costUSD. */
  expectedCostUSD: number;
  /** Expected schedule impact = probability * scheduleDays. */
  expectedScheduleDays: number;
}

export interface SolutionImpact {
  solution: SolutionPlan;
  directCostUSD: number;
  /** Expected total downstream cost (sum of node expectedCostUSD). */
  expectedDownstreamCostUSD: number;
  /** Days of schedule slip after applying solution. */
  netScheduleSlipDays: number;
  /** Capital carrying cost from slip. */
  carryingCostUSD: number;
  /** Rate-lock penalty if slip pushes past expiry. */
  rateLockPenaltyUSD: number;
  /** Sum of all costs (direct + downstream + carry + penalty). */
  totalImpactUSD: number;
  /** Savings vs. do-nothing baseline (positive = better). */
  savingsVsDoNothingUSD: number;
  /** Days saved vs. do-nothing. */
  daysSavedVsDoNothing: number;
  /** Per-node breakdown for the cascade graph. */
  nodeImpacts: CascadeNodeImpact[];
  /** True if this option is feasible under the constraints. */
  feasible: boolean;
  feasibilityNotes: string[];
}

export interface AnalysisResult {
  scenario: Scenario;
  constraints: Constraints;
  /** Indexed by solution id. */
  bySolution: Record<string, SolutionImpact>;
  /** Solution id ranked by lowest total impact among feasible options. */
  rankedSolutionIds: string[];
  /** Reference: the do-nothing impact, always present. */
  doNothing: SolutionImpact;
  /** The recommended solution id. */
  recommendedId: string;
}
