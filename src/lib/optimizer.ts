import type {
  AnalysisResult,
  CascadeNode,
  CascadeNodeImpact,
  Constraints,
  Scenario,
  SolutionImpact,
  SolutionPlan,
} from "./types";

/**
 * Walk the cascade DAG and compute the effective probability that each node
 * materializes, given:
 *  - the node's own conditional probability vs. its parents
 *  - the chosen solution's `cascadeProbabilityMultiplier` (clamps risk down/up)
 *  - the user's risk appetite (lower appetite -> nudge probabilities upward
 *    so the model is more conservative about discounting)
 *
 * Multiple parents are combined via "noisy-OR" — i.e. the node fires if ANY
 * parent fires and the conditional roll succeeds. This is the standard
 * Bayesian-network combination for independent causal links.
 */
function computeEffectiveProbabilities(
  cascade: CascadeNode[],
  solution: SolutionPlan,
  constraints: Constraints
): Map<string, number> {
  const byId = new Map(cascade.map((n) => [n.id, n]));
  const effective = new Map<string, number>();

  // Risk appetite: 1.0 = take savings at face value; 0.0 = inflate probabilities ~30%.
  const conservativismBoost = 1 + (1 - constraints.riskAppetite) * 0.3;
  const mult = solution.cascadeProbabilityMultiplier * conservativismBoost;

  // Topological order via simple DFS memoization
  function visit(id: string): number {
    const cached = effective.get(id);
    if (cached !== undefined) return cached;

    const node = byId.get(id);
    if (!node) return 0;

    const localCond = clamp01(node.probability * mult);

    if (node.parents.length === 0) {
      effective.set(id, localCond);
      return localCond;
    }

    // Noisy-OR over parents
    let noFire = 1;
    for (const pid of node.parents) {
      const pFires = visit(pid);
      noFire *= 1 - pFires * localCond;
    }
    const p = clamp01(1 - noFire);
    effective.set(id, p);
    return p;
  }

  for (const n of cascade) visit(n.id);
  return effective;
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/**
 * Compute the impact of a single solution on the scenario.
 */
export function computeSolutionImpact(
  scenario: Scenario,
  solution: SolutionPlan,
  constraints: Constraints
): SolutionImpact {
  const effProb = computeEffectiveProbabilities(
    scenario.cascade,
    solution,
    constraints
  );

  const nodeImpacts: CascadeNodeImpact[] = scenario.cascade.map((node) => {
    const p = effProb.get(node.id) ?? 0;
    return {
      node,
      effectiveProbability: p,
      expectedCostUSD: p * node.costUSD,
      expectedScheduleDays: p * node.scheduleDays,
    };
  });

  const expectedDownstreamCost = nodeImpacts.reduce(
    (acc, n) => acc + n.expectedCostUSD,
    0
  );

  // Schedule slip: solution.scheduleDeltaDays is the deterministic floor;
  // we add the expected schedule impact of the cascade nodes that affect
  // the critical path. For the demo we treat all expectedScheduleDays as
  // adding to the slip — this is a simplification that scans well in 90s.
  const expectedCascadeDays = nodeImpacts.reduce(
    (acc, n) => acc + n.expectedScheduleDays,
    0
  );
  const netSlip = Math.max(0, solution.scheduleDeltaDays + expectedCascadeDays);

  const carryingCost = netSlip * scenario.project.dailyCarryingCostUSD;

  // Rate-lock penalty: if the slip pushes completion past the rate-lock expiry,
  // the firm pays the penalty to refinance.
  const slipExceedsLock = projectedCompletionMissesLock(scenario, netSlip);
  const rateLockPenalty = slipExceedsLock
    ? scenario.project.rateLockPenaltyUSD
    : 0;

  const total =
    solution.directCostUSD +
    expectedDownstreamCost +
    carryingCost +
    rateLockPenalty;

  // Feasibility checks
  const notes: string[] = [];
  let feasible = true;
  if (solution.crewRequired > constraints.crewSize) {
    feasible = false;
    notes.push(
      `Requires ${solution.crewRequired} FTE; only ${constraints.crewSize} available.`
    );
  }
  if (
    solution.directCostUSD >
    constraints.budgetHeadroomUSD + scenario.project.totalBudgetUSD * 0.001
  ) {
    feasible = false;
    notes.push(
      `Direct cost exceeds available budget headroom by ${(
        (solution.directCostUSD - constraints.budgetHeadroomUSD) /
        1000
      ).toFixed(0)}K.`
    );
  }
  if (solution.requiresLongLeadMaterials && constraints.materialsConstrained) {
    feasible = false;
    notes.push(
      "Requires long-lead materials currently constrained by supplier."
    );
  }
  // Hard deadline check
  if (constraints.hardDeadline) {
    const deadlineDay = daysFromT0(
      scenario,
      constraints.hardDeadline
    );
    const projectedDay = projectBaselineEndDay(scenario) + netSlip;
    if (projectedDay > deadlineDay) {
      notes.push(
        `Projected completion slips ${projectedDay - deadlineDay}d past hard deadline.`
      );
    }
  }

  return {
    solution,
    directCostUSD: solution.directCostUSD,
    expectedDownstreamCostUSD: expectedDownstreamCost,
    netScheduleSlipDays: netSlip,
    carryingCostUSD: carryingCost,
    rateLockPenaltyUSD: rateLockPenalty,
    totalImpactUSD: total,
    savingsVsDoNothingUSD: 0, // backfilled in analyzeScenario
    daysSavedVsDoNothing: 0,
    nodeImpacts,
    feasible,
    feasibilityNotes: notes,
  };
}

function projectedCompletionMissesLock(
  scenario: Scenario,
  netSlip: number
): boolean {
  const projectedEndDay = projectBaselineEndDay(scenario) + netSlip;
  const lockDay = daysFromT0(scenario, scenario.project.rateLockExpiry);
  return projectedEndDay > lockDay;
}

function projectBaselineEndDay(scenario: Scenario): number {
  return scenario.baselineSchedule.reduce(
    (acc, a) => Math.max(acc, a.startDay + a.durationDays),
    0
  );
}

function daysFromT0(scenario: Scenario, targetISO: string): number {
  // T0 = scheduled completion - max(end day of baseline).
  // We don't know T0 explicitly; instead, treat scheduledCompletion as the
  // end day of the baseline.
  const baselineEndDay = projectBaselineEndDay(scenario);
  const completionISO = scenario.project.scheduledCompletion;
  const completion = new Date(completionISO).getTime();
  const target = new Date(targetISO).getTime();
  const dayDelta = Math.round(
    (target - completion) / (1000 * 60 * 60 * 24)
  );
  return baselineEndDay + dayDelta;
}

/**
 * Run the analysis: compute impact of all solutions, rank, recommend.
 */
export function analyzeScenario(
  scenario: Scenario,
  constraints: Constraints
): AnalysisResult {
  const bySolution: Record<string, SolutionImpact> = {};
  for (const sol of scenario.solutions) {
    bySolution[sol.id] = computeSolutionImpact(scenario, sol, constraints);
  }

  const doNothing = bySolution["do-nothing"] ??
    computeSolutionImpact(scenario, syntheticDoNothing(), constraints);

  // Backfill savings vs do-nothing
  for (const id of Object.keys(bySolution)) {
    const s = bySolution[id];
    s.savingsVsDoNothingUSD = doNothing.totalImpactUSD - s.totalImpactUSD;
    s.daysSavedVsDoNothing =
      doNothing.netScheduleSlipDays - s.netScheduleSlipDays;
  }

  // Rank feasible solutions by total impact ascending; tag the best feasible
  // non-do-nothing as the recommendation.
  const feasibleIds = Object.values(bySolution)
    .filter((s) => s.feasible)
    .sort((a, b) => a.totalImpactUSD - b.totalImpactUSD)
    .map((s) => s.solution.id);
  const recommendedId =
    feasibleIds.find((id) => id !== "do-nothing") ?? feasibleIds[0] ?? "do-nothing";

  return {
    scenario,
    constraints,
    bySolution,
    rankedSolutionIds: feasibleIds,
    doNothing,
    recommendedId,
  };
}

function syntheticDoNothing(): SolutionPlan {
  return {
    id: "do-nothing",
    strategy: "do-nothing",
    name: "Do nothing",
    oneLiner: "Absorb the cascade.",
    crewRequired: 0,
    directCostUSD: 0,
    scheduleDeltaDays: 0,
    cascadeProbabilityMultiplier: 1,
    residualRiskScore: 100,
    steps: ["Accept all downstream risk exposure."],
    requiresLongLeadMaterials: false,
  };
}
