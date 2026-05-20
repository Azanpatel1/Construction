import type { Scenario } from "./types";
import type {
  AnalystInput,
  ProjectType,
  ProjectPhase,
  RiskArea,
  ResourceConstraint,
} from "./analyst";

/**
 * Translate a Scenario (from scenarios.ts) into AnalystInput defaults so the
 * triage panel pre-fills sensible values when the user switches projects.
 */

const ASSET_CLASS_TO_PROJECT_TYPE: Record<string, ProjectType> = {
  "Class A Office": "Office",
  "Mixed-Use Tower": "Mixed-Use",
  Hospitality: "Hospitality",
  Industrial: "Industrial / Manufacturing",
  Multifamily: "Residential",
};

const CATEGORY_TO_RISK_AREA: Record<string, RiskArea> = {
  structural: "Structural",
  mep: "Mechanical",
  finishes: "Interior Finishes",
  financing: "Structural",
  regulatory: "Structural",
  schedule: "Structural",
};

const SEVERITY_TO_CONFIDENCE: Record<string, number> = {
  low: 78,
  medium: 62,
  high: 48,
  critical: 32,
};

export function scenarioToAnalystInput(
  scenario: Scenario,
  fallback: AnalystInput
): AnalystInput {
  const projectType =
    ASSET_CLASS_TO_PROJECT_TYPE[scenario.project.assetClass] ?? fallback.projectType;

  // Derive risk area from the first cascade node category (the root cause).
  const rootCategory = scenario.cascade[0]?.category ?? "structural";
  const riskArea = CATEGORY_TO_RISK_AREA[rootCategory] ?? fallback.riskArea;

  const drawingConfidence =
    SEVERITY_TO_CONFIDENCE[scenario.issue.severity] ?? fallback.drawingConfidence;

  // Rough sqft heuristic: budget / $700 sqft for hospitality/office, $850 for lab.
  const psf =
    projectType === "Lab / Life Sciences" ||
    projectType === "Healthcare" ||
    projectType === "Industrial / Manufacturing"
      ? 850
      : 700;
  const sizeSqft = Math.round(scenario.project.totalBudgetUSD / psf / 1000) * 1000;

  const phase: ProjectPhase = "Active Construction";

  const blocker = scenario.issue.title.includes("misalignment") ||
    scenario.issue.title.includes("shortfall")
    ? `Open RFI on ${scenario.issue.title.toLowerCase()} — design conflict gating ${riskArea.toLowerCase()} work.`
    : scenario.issue.title;

  const resourceConstraint: ResourceConstraint = "Time";

  return {
    description: scenario.issue.description,
    projectType,
    sizeSqft,
    phase,
    drawingConfidence,
    riskArea,
    blocker,
    resourceConstraint,
  };
}
