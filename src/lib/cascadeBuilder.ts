import type { CascadeNode, Scenario } from "./types";
import type { RiskArea } from "./analyst";
import type { UnifiedInput } from "./runAnalysis";

/**
 * Generates a rich 8-node downstream cascade tailored to the user's inputs.
 * Used whenever the active scenario doesn't already carry a hand-tuned
 * cascade (e.g. user-created projects).
 *
 *   Topology mirrors the Marriott demo:
 *
 *         ┌─ adjacentTradeA ──┐
 *         │                   ├─ changeOrders ─┐
 *   root ─┼─ adjacentTradeB ──┘                ├─ keyDateRisk
 *         │                                    │
 *         ├─ envelopeImpact ───┐               │
 *         │                    │               │
 *         └─ permitFiling ─────┴─ ratelock ────┘
 */

type ChildSpec = {
  label: string;
  domain: string;
  category: CascadeNode["category"];
  /** Share of the budget reference. */
  costShare: number;
  days: number;
  probability: number;
};

type Template = {
  rootLabel: string;
  rootDomain: string;
  rootCategory: CascadeNode["category"];
  children: [ChildSpec, ChildSpec, ChildSpec, ChildSpec]; // [tradeA, tradeB, envelope, permit]
};

function templateFor(area: RiskArea): Template {
  switch (area) {
    case "Structural":
      return {
        rootLabel: "Structural rework",
        rootDomain: "Structural",
        rootCategory: "structural",
        children: [
          {
            label: "MEP risers rerouted",
            domain: "MEP",
            category: "mep",
            costShare: 0.0027,
            days: 9,
            probability: 0.55,
          },
          {
            label: "Elevator shaft realignment",
            domain: "Vertical Transport",
            category: "structural",
            costShare: 0.0015,
            days: 11,
            probability: 0.45,
          },
          {
            label: "Curtain wall remeasure",
            domain: "Envelope",
            category: "finishes",
            costShare: 0.0012,
            days: 6,
            probability: 0.4,
          },
          {
            label: "Permit revision filing",
            domain: "Regulatory",
            category: "regulatory",
            costShare: 0.0003,
            days: 12,
            probability: 0.5,
          },
        ],
      };
    case "Mechanical":
      return {
        rootLabel: "Mechanical rework",
        rootDomain: "Mechanical",
        rootCategory: "mep",
        children: [
          {
            label: "Electrical reroute & coordination",
            domain: "Electrical",
            category: "mep",
            costShare: 0.0021,
            days: 8,
            probability: 0.55,
          },
          {
            label: "Fire-protection rebalance",
            domain: "Fire Protection",
            category: "mep",
            costShare: 0.0014,
            days: 7,
            probability: 0.45,
          },
          {
            label: "Ceiling / soffit remeasure",
            domain: "Finishes",
            category: "finishes",
            costShare: 0.001,
            days: 5,
            probability: 0.4,
          },
          {
            label: "Mech permit revision & re-balance",
            domain: "Regulatory",
            category: "regulatory",
            costShare: 0.0003,
            days: 10,
            probability: 0.5,
          },
        ],
      };
    case "Electrical":
      return {
        rootLabel: "Electrical reframing",
        rootDomain: "Electrical",
        rootCategory: "mep",
        children: [
          {
            label: "Low-voltage & controls reroute",
            domain: "Low-Voltage",
            category: "mep",
            costShare: 0.0018,
            days: 7,
            probability: 0.55,
          },
          {
            label: "Switchgear access mod",
            domain: "Electrical",
            category: "mep",
            costShare: 0.0014,
            days: 9,
            probability: 0.4,
          },
          {
            label: "Lighting layout remeasure",
            domain: "Lighting",
            category: "finishes",
            costShare: 0.0008,
            days: 4,
            probability: 0.45,
          },
          {
            label: "Electrical permit revision",
            domain: "Regulatory",
            category: "regulatory",
            costShare: 0.0003,
            days: 10,
            probability: 0.5,
          },
        ],
      };
    case "Plumbing":
      return {
        rootLabel: "Plumbing reroute",
        rootDomain: "Plumbing",
        rootCategory: "mep",
        children: [
          {
            label: "Wall openings & coring",
            domain: "Structural",
            category: "structural",
            costShare: 0.0016,
            days: 6,
            probability: 0.55,
          },
          {
            label: "MEP coordination resync",
            domain: "MEP",
            category: "mep",
            costShare: 0.0014,
            days: 7,
            probability: 0.45,
          },
          {
            label: "Floor penetration patching",
            domain: "Finishes",
            category: "finishes",
            costShare: 0.0009,
            days: 5,
            probability: 0.4,
          },
          {
            label: "Plumbing permit revision",
            domain: "Regulatory",
            category: "regulatory",
            costShare: 0.0003,
            days: 9,
            probability: 0.5,
          },
        ],
      };
    case "Fire Protection":
      return {
        rootLabel: "Fire-protection rebalance",
        rootDomain: "Fire Protection",
        rootCategory: "mep",
        children: [
          {
            label: "Sprinkler head reconfiguration",
            domain: "Fire Protection",
            category: "mep",
            costShare: 0.0015,
            days: 6,
            probability: 0.55,
          },
          {
            label: "Smoke-control re-tuning",
            domain: "Life-Safety",
            category: "mep",
            costShare: 0.0012,
            days: 6,
            probability: 0.45,
          },
          {
            label: "Ceiling re-finish at modified zones",
            domain: "Finishes",
            category: "finishes",
            costShare: 0.0008,
            days: 4,
            probability: 0.4,
          },
          {
            label: "AHJ inspection re-test",
            domain: "Regulatory",
            category: "regulatory",
            costShare: 0.0003,
            days: 8,
            probability: 0.55,
          },
        ],
      };
    case "Envelope / Facade":
      return {
        rootLabel: "Envelope rebuild",
        rootDomain: "Envelope",
        rootCategory: "finishes",
        children: [
          {
            label: "Curtain wall remeasure & re-fab",
            domain: "Envelope",
            category: "finishes",
            costShare: 0.0024,
            days: 10,
            probability: 0.6,
          },
          {
            label: "Air & vapor barrier rework",
            domain: "Envelope",
            category: "finishes",
            costShare: 0.0014,
            days: 6,
            probability: 0.5,
          },
          {
            label: "Structural backup verification",
            domain: "Structural",
            category: "structural",
            costShare: 0.0011,
            days: 7,
            probability: 0.35,
          },
          {
            label: "Energy-code revision filing",
            domain: "Regulatory",
            category: "regulatory",
            costShare: 0.0003,
            days: 10,
            probability: 0.5,
          },
        ],
      };
    case "Site / Civil":
      return {
        rootLabel: "Site / civil correction",
        rootDomain: "Civil",
        rootCategory: "structural",
        children: [
          {
            label: "Stormwater & grading rework",
            domain: "Civil",
            category: "structural",
            costShare: 0.0018,
            days: 8,
            probability: 0.55,
          },
          {
            label: "Underground utility reroute",
            domain: "Utilities",
            category: "mep",
            costShare: 0.0016,
            days: 9,
            probability: 0.45,
          },
          {
            label: "Foundation review & verification",
            domain: "Structural",
            category: "structural",
            costShare: 0.0012,
            days: 8,
            probability: 0.4,
          },
          {
            label: "Site permit revision",
            domain: "Regulatory",
            category: "regulatory",
            costShare: 0.0003,
            days: 12,
            probability: 0.55,
          },
        ],
      };
    case "Interior Finishes":
      return {
        rootLabel: "Finish remediation",
        rootDomain: "Finishes",
        rootCategory: "finishes",
        children: [
          {
            label: "Drywall & framing rework",
            domain: "Finishes",
            category: "finishes",
            costShare: 0.0014,
            days: 5,
            probability: 0.55,
          },
          {
            label: "Paint & coatings re-application",
            domain: "Finishes",
            category: "finishes",
            costShare: 0.001,
            days: 4,
            probability: 0.45,
          },
          {
            label: "Flooring rework & transitions",
            domain: "Finishes",
            category: "finishes",
            costShare: 0.0011,
            days: 5,
            probability: 0.4,
          },
          {
            label: "Inspection / punchlist rework",
            domain: "Regulatory",
            category: "regulatory",
            costShare: 0.0003,
            days: 7,
            probability: 0.5,
          },
        ],
      };
    case "Vertical Transport":
      return {
        rootLabel: "Vertical transport realignment",
        rootDomain: "Vertical Transport",
        rootCategory: "structural",
        children: [
          {
            label: "Hoistway / shaft modification",
            domain: "Structural",
            category: "structural",
            costShare: 0.0021,
            days: 10,
            probability: 0.55,
          },
          {
            label: "MEP penetrations & re-coordination",
            domain: "MEP",
            category: "mep",
            costShare: 0.0014,
            days: 7,
            probability: 0.45,
          },
          {
            label: "Lobby finish modifications",
            domain: "Finishes",
            category: "finishes",
            costShare: 0.0009,
            days: 5,
            probability: 0.4,
          },
          {
            label: "Code-compliance re-cert",
            domain: "Regulatory",
            category: "regulatory",
            costShare: 0.0003,
            days: 10,
            probability: 0.55,
          },
        ],
      };
  }
}

function locationSuffix(loc: string): string {
  const trimmed = loc.trim();
  return trimmed ? ` — ${trimmed}` : "";
}

function pickBudgetReference(scenario: Scenario, input: UnifiedInput): number {
  // Prefer the scenario's own total budget; fall back to a size×PSF estimate
  // so user-created projects with a non-zero size still produce sensible
  // cost magnitudes.
  if (scenario.project.totalBudgetUSD > 0) return scenario.project.totalBudgetUSD;
  const psf =
    input.projectType === "Lab / Life Sciences" ||
    input.projectType === "Healthcare" ||
    input.projectType === "Industrial / Manufacturing"
      ? 850
      : 700;
  return Math.max(10_000_000, input.sizeSqft * psf);
}

/**
 * Build an 8-node cascade DAG tailored to the user's inputs.
 */
export function buildCascadeFromInput(
  scenario: Scenario,
  input: UnifiedInput
): CascadeNode[] {
  const t = templateFor(input.riskArea);
  const budget = pickBudgetReference(scenario, input);
  const suffix = locationSuffix(input.issueLocation);
  const id = (k: string) => `gen-${k}`;

  const rootCost = Math.round(budget * 0.0035);
  const rootDays = 14;

  const root: CascadeNode = {
    id: id("root"),
    label: `${t.rootLabel}${suffix}`,
    domain: t.rootDomain,
    costUSD: rootCost,
    scheduleDays: rootDays,
    probability: 1,
    parents: [],
    category: t.rootCategory,
  };

  const [a, b, c, d] = t.children;
  const childA: CascadeNode = {
    id: id("trade-a"),
    label: a.label,
    domain: a.domain,
    costUSD: Math.round(budget * a.costShare),
    scheduleDays: a.days,
    probability: a.probability,
    parents: [root.id],
    category: a.category,
  };
  const childB: CascadeNode = {
    id: id("trade-b"),
    label: b.label,
    domain: b.domain,
    costUSD: Math.round(budget * b.costShare),
    scheduleDays: b.days,
    probability: b.probability,
    parents: [root.id],
    category: b.category,
  };
  const childC: CascadeNode = {
    id: id("envelope"),
    label: c.label,
    domain: c.domain,
    costUSD: Math.round(budget * c.costShare),
    scheduleDays: c.days,
    probability: c.probability,
    parents: [root.id],
    category: c.category,
  };
  const childD: CascadeNode = {
    id: id("permit"),
    label: d.label,
    domain: d.domain,
    costUSD: Math.round(budget * d.costShare),
    scheduleDays: d.days,
    probability: d.probability,
    parents: [root.id],
    category: d.category,
  };

  const changeOrders: CascadeNode = {
    id: id("change-orders"),
    label: "GC change orders + mark-up",
    domain: "Contracts",
    costUSD: Math.round(budget * 0.001),
    scheduleDays: 0,
    probability: 0.65,
    parents: [childA.id, childB.id],
    category: "financing",
  };

  const rateLock: CascadeNode = {
    id: id("rate-lock"),
    label: "Construction loan rate-lock pressure",
    domain: "Financing",
    costUSD: Math.round(budget * 0.008),
    scheduleDays: 0,
    probability: 0.45,
    parents: [childD.id, changeOrders.id],
    category: "financing",
  };

  const keyDate: CascadeNode = {
    id: id("key-date"),
    label: ownerOpeningLabel(input),
    domain: "Operator",
    costUSD: Math.round(budget * 0.0035),
    scheduleDays: 0,
    probability: 0.35,
    parents: [rateLock.id, changeOrders.id],
    category: "financing",
  };

  return [root, childA, childB, childC, childD, changeOrders, rateLock, keyDate];
}

function ownerOpeningLabel(input: UnifiedInput): string {
  switch (input.projectType) {
    case "Hospitality":
      return "Operator key-date opening penalty";
    case "Healthcare":
      return "License / activation date slip";
    case "Education":
      return "Academic-year opening at risk";
    case "Retail":
      return "Tenant rent commencement slip";
    case "Lab / Life Sciences":
      return "Validation / GMP readiness slip";
    case "Industrial / Manufacturing":
      return "Production-start ramp slip";
    case "Mixed-Use":
    case "Residential":
      return "Owner key-date / occupancy risk";
    default:
      return "Owner key-date / opening risk";
  }
}
