import type {
  AnalystInput,
  AnalystOutput,
  ProjectType,
  ProjectPhase,
  RiskArea,
  ResourceConstraint,
} from "./analyst";
import { runAnalyst } from "./analyst";
import { analyzeScenario } from "./optimizer";
import type {
  AnalysisResult,
  Constraints,
  Scenario,
  Severity,
} from "./types";

/**
 * Unified user input — drives BOTH the analyst (project triage) and the
 * cascade optimizer (cost / schedule / cascade graph).
 */
export interface UnifiedInput {
  /* Project context */
  description: string;
  projectType: ProjectType;
  sizeSqft: number;
  phase: ProjectPhase;
  drawingConfidence: number;
  riskArea: RiskArea;
  blocker: string;
  resourceConstraint: ResourceConstraint;
  issueLocation: string;

  /* Constraints */
  budgetHeadroomUSD: number;
  crewSize: number;
  riskAppetite: number;
  materialsConstrained: boolean;
}

export interface UnifiedAnalysis {
  analyst: AnalystOutput;
  cascade: AnalysisResult;
  /** Severity derived from drawing confidence (used in header chip). */
  derivedSeverity: Severity;
}

function severityFromConfidence(confidence: number): Severity {
  if (confidence <= 30) return "critical";
  if (confidence <= 60) return "high";
  if (confidence <= 80) return "medium";
  return "low";
}

/**
 * Project the user's drawing-confidence into the cascade graph by scaling
 * every node's base probability. Lower confidence → higher cascade prob.
 *
 *   confidence 100% → factor 1.0  (no change)
 *   confidence 50%  → factor 1.25
 *   confidence 0%   → factor 1.5
 */
function applyConfidenceToScenario(
  base: Scenario,
  input: UnifiedInput
): Scenario {
  const factor = 1 + (1 - input.drawingConfidence / 100) * 0.5;
  return {
    ...base,
    issue: {
      ...base.issue,
      description: input.description || base.issue.description,
      location: input.issueLocation || base.issue.location,
      severity: severityFromConfidence(input.drawingConfidence),
    },
    cascade: base.cascade.map((n) => ({
      ...n,
      probability: Math.max(0, Math.min(1, n.probability * factor)),
    })),
  };
}

function toAnalystInput(input: UnifiedInput): AnalystInput {
  return {
    description: input.description,
    projectType: input.projectType,
    sizeSqft: input.sizeSqft,
    phase: input.phase,
    drawingConfidence: input.drawingConfidence,
    riskArea: input.riskArea,
    blocker: input.blocker,
    resourceConstraint: input.resourceConstraint,
  };
}

function toConstraints(input: UnifiedInput): Constraints {
  return {
    budgetHeadroomUSD: input.budgetHeadroomUSD,
    crewSize: input.crewSize,
    hardDeadline: "",
    materialsConstrained: input.materialsConstrained,
    riskAppetite: input.riskAppetite,
  };
}

/**
 * Run the full analysis for the given inputs against the given scenario
 * template. Returns both the analyst output and the cascade analysis.
 */
export function runUnifiedAnalysis(
  baseScenario: Scenario,
  input: UnifiedInput
): UnifiedAnalysis {
  const scenarioForCascade = applyConfidenceToScenario(baseScenario, input);
  const cascade = analyzeScenario(scenarioForCascade, toConstraints(input));
  const analyst = runAnalyst(toAnalystInput(input));
  return {
    analyst,
    cascade,
    derivedSeverity: severityFromConfidence(input.drawingConfidence),
  };
}

/**
 * Build a sensible default UnifiedInput from a Scenario template. Used when
 * the user switches projects in the sidebar.
 */
export function unifiedInputFromScenario(
  scenario: Scenario,
  fallback: UnifiedInput
): UnifiedInput {
  // Map asset class -> ProjectType
  const projectTypeMap: Record<string, ProjectType> = {
    "Class A Office": "Office",
    "Mixed-Use Tower": "Mixed-Use",
    Hospitality: "Hospitality",
    Industrial: "Industrial / Manufacturing",
    Multifamily: "Residential",
  };
  const riskAreaMap: Record<string, RiskArea> = {
    structural: "Structural",
    mep: "Mechanical",
    finishes: "Interior Finishes",
    financing: "Structural",
    regulatory: "Structural",
    schedule: "Structural",
  };
  const severityToConfidence: Record<string, number> = {
    low: 78,
    medium: 62,
    high: 48,
    critical: 32,
  };

  const projectType =
    projectTypeMap[scenario.project.assetClass] ?? fallback.projectType;
  const riskArea =
    riskAreaMap[scenario.cascade[0]?.category ?? "structural"] ?? fallback.riskArea;
  const drawingConfidence =
    severityToConfidence[scenario.issue.severity] ?? fallback.drawingConfidence;

  const psf =
    projectType === "Lab / Life Sciences" ||
    projectType === "Healthcare" ||
    projectType === "Industrial / Manufacturing"
      ? 850
      : 700;
  const sizeSqft = Math.round(scenario.project.totalBudgetUSD / psf / 1000) * 1000;

  return {
    ...fallback,
    description: scenario.issue.description,
    projectType,
    sizeSqft,
    drawingConfidence,
    riskArea,
    issueLocation: scenario.issue.location,
    blocker: `Open RFI on ${scenario.issue.title.toLowerCase()} — design conflict gating ${riskArea.toLowerCase()} work.`,
  };
}

export const BLANK_UNIFIED_INPUT: UnifiedInput = {
  description: "",
  projectType: "Office",
  sizeSqft: 0,
  phase: "Active Construction",
  drawingConfidence: 60,
  riskArea: "Structural",
  blocker: "",
  resourceConstraint: "Time",
  issueLocation: "",
  budgetHeadroomUSD: 3_000_000,
  crewSize: 20,
  riskAppetite: 0.55,
  materialsConstrained: false,
};
