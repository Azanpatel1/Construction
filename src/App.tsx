import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { IssuePanel } from "./components/IssuePanel";
import { ImpactSummary } from "./components/ImpactSummary";
import { CostWaterfall } from "./components/CostWaterfall";
import { TimelineGantt } from "./components/TimelineGantt";
import { CascadeGraph } from "./components/CascadeGraph";
import { SolutionCards } from "./components/SolutionCards";
import { SolutionDrilldown } from "./components/SolutionDrilldown";
import { EmptyState } from "./components/EmptyState";
import { allScenarios, defaultConstraints } from "./lib/scenarios";
import { analyzeScenario } from "./lib/optimizer";
import type { AnalysisResult, Constraints, SolutionImpact } from "./lib/types";

function App() {
  const [activeId, setActiveId] = useState<string>(allScenarios[0].project.id);
  const activeScenario = useMemo(
    () =>
      allScenarios.find((s) => s.project.id === activeId) ?? allScenarios[0],
    [activeId]
  );

  const initialConstraints: Constraints = useMemo(() => {
    if (activeId === allScenarios[0].project.id)
      return defaultConstraints.marriottTower;
    return defaultConstraints.austinLifeSci;
  }, [activeId]);

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [drilldown, setDrilldown] = useState<SolutionImpact | null>(null);

  function runAnalysis(c: Constraints) {
    setIsAnalyzing(true);
    setDrilldown(null);
    // Brief "thinking" pause so the demo lands. Synchronous compute would be jarring.
    setTimeout(() => {
      const result = analyzeScenario(activeScenario, c);
      setAnalysis(result);
      setAnalyzedAt(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
      setIsAnalyzing(false);
    }, 650);
  }

  function reset() {
    setAnalysis(null);
    setAnalyzedAt(null);
    setDrilldown(null);
  }

  function switchScenario(id: string) {
    setActiveId(id);
    setAnalysis(null);
    setAnalyzedAt(null);
    setDrilldown(null);
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-ink-950 text-text font-sans">
      <Sidebar
        scenarios={allScenarios}
        activeId={activeId}
        onSelect={switchScenario}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <Header scenario={activeScenario} analyzedAt={analyzedAt} />

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <IssuePanel
            key={activeScenario.project.id}
            scenario={activeScenario}
            initialConstraints={initialConstraints}
            isAnalyzing={isAnalyzing}
            onRun={runAnalysis}
            onReset={reset}
          />

          <AnimatePresence mode="wait">
            {!analysis && !isAnalyzing && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <EmptyState onRun={() => runAnalysis(initialConstraints)} />
              </motion.div>
            )}

            {isAnalyzing && (
              <motion.div
                key="thinking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="panel p-10 flex flex-col items-center justify-center gap-3"
              >
                <div className="flex items-center gap-2 text-gold-500 text-[11px] font-mono uppercase tracking-[0.18em]">
                  <ThinkingDots />
                  Solving cascade graph
                </div>
                <div className="text-[12px] text-muted font-mono">
                  Computing noisy-OR probabilities · scoring {activeScenario.solutions.length} solutions
                </div>
              </motion.div>
            )}

            {analysis && !isAnalyzing && (
              <motion.div
                key="dash"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="space-y-5"
              >
                <ImpactSummary analysis={analysis} />
                <div className="grid grid-cols-2 gap-5">
                  <CostWaterfall
                    impact={analysis.bySolution[analysis.recommendedId]}
                    doNothingImpact={analysis.doNothing}
                  />
                  <TimelineGantt
                    scenario={activeScenario}
                    impact={analysis.bySolution[analysis.recommendedId]}
                  />
                </div>
                <CascadeGraph
                  impact={analysis.bySolution[analysis.recommendedId]}
                  doNothingImpact={analysis.doNothing}
                />
                <SolutionCards
                  analysis={analysis}
                  onSelect={(impact) => setDrilldown(impact)}
                  selectedId={drilldown?.solution.id ?? null}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <footer className="pt-4 pb-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.18em] text-muted">
            <div>ArchImpact · Construction Risk Underwriting · Demo build</div>
            <div className="flex items-center gap-3">
              <span>Bayesian cascade engine v0.1</span>
              <span className="opacity-50">·</span>
              <span>Calibrated to RSMeans 2025</span>
            </div>
          </footer>
        </div>
      </main>

      <SolutionDrilldown
        impact={drilldown}
        doNothingImpact={analysis?.doNothing ?? null}
        onClose={() => setDrilldown(null)}
      />
    </div>
  );
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block w-1 h-1 rounded-full bg-gold-500"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            repeat: Infinity,
            duration: 0.9,
            delay: i * 0.18,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}

export default App;
