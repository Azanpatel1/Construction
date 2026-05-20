# ArchImpact

> Bloomberg Terminal for construction risk — quantify the downstream cost of
> architectural inaccuracies for IB underwriters of CRE construction debt.

## What it does

When an architect discovers an inaccuracy in a project's drawings (a
misaligned column grid, a wrong mechanical clearance, etc.), ArchImpact
quantifies the **full downstream impact** that flows from it:

- Direct remediation cost
- Expected cost of the cascading change orders, MEP rework, permit revisions,
  and tenant impacts (computed via a noisy-OR Bayesian cascade graph)
- Capital carrying cost from schedule slip
- Rate-lock penalty if the slip pushes past the construction-loan rate-lock
  expiry

It then scores up to four remediation strategies — **Do nothing /
Conservative / Recommended / Aggressive** — against the architect's
constraints (budget headroom, available crew, risk appetite,
material lead-time) and ranks them by total impact.

## Stack

- **Vite + React 18 + TypeScript**
- **Tailwind CSS** with a custom IB-trader palette
- **Recharts** for the cost waterfall
- **Framer Motion** for state transitions
- **Lucide** for icons
- Hand-rolled SVG cascade graph (no extra graph dep)
- 100% client-side. No backend, no API keys.

## Run it

```bash
npm install
npm run dev
# → http://localhost:5173
```

Build:

```bash
npm run build && npm run preview
```

## Demo script (3 min)

1. **Open** `http://localhost:5173`. Sidebar shows two pre-loaded analyses;
   *Marriott Tower — 1101 Wabash* is selected by default.
2. **Set the scene (20s):**
   > "An architect just discovered the column grid on floor 14 of this
   > $612M Chicago hotel project is offset 18 inches from the structural
   > drawings. The structural drawings drove the loan underwriting. The
   > question for the lender is: how exposed are we?"
3. **Click "Run impact model".** The Bayesian cascade engine resolves;
   dashboard fades in.
4. **Walk through the top row of summary cards (20s):**
   - $14M+ exposure if no action
   - $7.5M cost on the recommended path
   - **$6.8M of capital preserved**
   - 15 days of schedule recovered
5. **Cost waterfall (20s):** Direct fix is only $3.7M — but the downstream
   cascade, capital carry, and a rate-lock penalty more than double it. *The
   waterfall is the underwriter's story.*
6. **Timeline gantt (15s):** Highlight the red slip band and the dashed
   rate-lock marker — *"this is what triggers the $4.8M penalty if we
   slip past June 30."*
7. **Cascade graph (20s):** Hover the **"Rate-lock at risk"** node — *"this
   single node carries $2.9M of expected loss; mitigation drops its
   probability from 60% to 15%."*
8. **Solution cards (20s):** Show the four ranked options. Click
   **Recommended → drilldown modal** — show the execution steps and the
   cost breakdown panel.
9. **Adjust constraints live (15s):** Drag the **Risk Appetite** slider to
   the left → Re-run → totals shift. *"Lower risk appetite inflates
   expected losses; the model recommends the conservative path now."*
10. **Switch scenarios (10s):** Click *Domain Life Sciences Campus*. Show the
    sidebar updates and a different cascade graph loads.
11. **Close on the vision:** This plugs into existing underwriting workflows,
    trained on the firm's portfolio history.

## File map

```
src/
  App.tsx                 — composition root + state machine
  lib/
    types.ts              — domain model
    optimizer.ts          — noisy-OR cascade math + solution scoring
    scenarios.ts          — 2 calibrated IB-grade demo scenarios
    format.ts             — USD / day / pct / date helpers
  components/
    Sidebar.tsx           — active analyses list
    Header.tsx            — project & financing context
    IssuePanel.tsx        — issue input + constraint sliders + Run button
    ImpactSummary.tsx     — 4 KPI cards (exposure, cost, savings, days)
    CostWaterfall.tsx     — Recharts stacked-bar waterfall
    TimelineGantt.tsx     — schedule + critical path + rate-lock marker
    CascadeGraph.tsx      — Bayesian DAG with hover detail
    SolutionCards.tsx     — 4 ranked mitigation options
    SolutionDrilldown.tsx — modal: steps + cost breakdown
    EmptyState.tsx        — pre-analysis hero
    Logo.tsx
```

## Deploy to Cloudflare Pages

In the Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**, then pick this repo and use:

| Setting | Value |
|---|---|
| Framework preset | `Vite` (or `None`) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Node version | `20` (set via `NODE_VERSION` env var, or read from `.nvmrc`) |

SPA fallback is handled by `wrangler.jsonc` (`not_found_handling: "single-page-application"`). Do not add a `public/_redirects` file — it conflicts with Workers asset deploy and causes an infinite-loop error.

No environment variables or secrets are required — the demo is fully client-side.

## Pre-demo checklist

- [ ] `npm run dev` warm before judges arrive
- [ ] Browser zoom = 100%, devtools closed
- [ ] WiFi can be off — app is fully offline-capable
- [ ] Screen recording running as backup
- [ ] Have screenshots ready in case dev server dies

## How the math works (judge cheat-sheet)

- **Cascade probabilities** combine via **noisy-OR** across multiple parents:
  `P(node) = 1 − Π(1 − P(parent_i)·P(node|parent))`.
- **Risk appetite** acts as a conservatism multiplier on every node's
  conditional probability (lower appetite → ~30% inflation).
- **Solution multipliers** (e.g. `0.25` for "Recommended") clamp every node's
  conditional probability downward, reflecting how much of the cascade the
  chosen path actually prevents.
- **Carrying cost** = `daysOfSlip × dailyCarryingCost`. The daily rate is the
  drawn-capital APR / 365 applied to the project's drawn balance.
- **Rate-lock penalty** fires deterministically if `baselineEnd + slip >
  rateLockExpiry`.

Numbers are calibrated to RSMeans 2025 ranges for tier-1 US markets so the
demo feels real.
