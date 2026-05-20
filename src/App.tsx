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
import { AnalystPanel } from "./components/AnalystPanel";
import { AnalystResults } from "./components/AnalystResults";
import { allScenarios, defaultConstraints } from "./lib/scenarios";
import { analyzeScenario } from "./lib/optimizer";
import {
  runAnalyst,
  DEFAULT_ANALYST_INPUT,
  type AnalystInput,
} from "./lib/analyst";
import { scenarioToAnalystInput } from "./lib/scenarioMap";
import type { AnalysisResult, Constraints, SolutionImpact } from "./lib/types";

type Tab = "triage" | "cascade";

function App() {
  const [tab, setTab] = useState<Tab>("triage");
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

  const [analystInput, setAnalystInput] = useState<AnalystInput>(() =>
    scenarioToAnalystInput(activeScenario, DEFAULT_ANALYST_INPUT)
  );
  const analystOutput = useMemo(() => runAnalyst(analystInput), [analystInput]);

  function runAnalysis(c: Constraints) {
    setIsAnalyzing(true);
    setDrilldown(null);
    setTimeout(() => {
      const result = analyzeScenario(activeScenario, c);
      setAnalysis(result);
      setAnalyzedAt(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
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
    const next = allScenarios.find((s) => s.project.id === id) ?? allScenarios[0];
    setAnalystInput(scenarioToAnalystInput(next, DEFAULT_ANALYST_INPUT));
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

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Tab bar */}
          <div className="flex items-center gap-1 border-b border-line">
            <TabButton
              active={tab === "triage"}
              onClick={() => setTab("triage")}
            >
              Triage analysis
            </TabButton>
            <TabButton
              active={tab === "cascade"}
              onClick={() => setTab("cascade")}
            >
              Cascade detail
            </TabButton>
          </div>

          <AnimatePresence mode="wait">
            {tab === "triage" ? (
              <motion.div
                key="triage"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <AnalystPanel value={analystInput} onChange={setAnalystInput} />
                <AnalystResults output={analystOutput} />
              </motion.div>
            ) : (
              <motion.div
                key="cascade"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <IssuePanel
                  key={activeScenario.project.id}
                  scenario={activeScenario}
                  initialConstraints={initialConstraints}
                  isAnalyzing={isAnalyzing}
                  onRun={runAnalysis}
                  onReset={reset}
                />

                {!analysis && !isAnalyzing && (
                  <EmptyState onRun={() => runAnalysis(initialConstraints)} />
                )}

                {isAnalyzing && (
                  <div className="panel p-12 flex flex-col items-center justify-center gap-3">
                    <div className="flex items-center gap-2 text-gold-600 text-sm">
                      <ThinkingDots />
                      Analyzing cascade
                    </div>
                    <p className="text-xs text-muted">
                      Scoring {activeScenario.solutions.length} mitigation paths
                    </p>
                  </div>
                )}

                {analysis && !isAnalyzing && (
                  <div className="space-y-6">
                    <ImpactSummary analysis={analysis} />
                    <div className="grid grid-cols-2 gap-6">
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
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <footer className="pt-6 pb-2 text-xs text-muted">
            ArchImpact · Risk analyst + cascade impact model
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

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium relative transition ${
        active
          ? "text-gold-600"
          : "text-muted hover:text-text"
      }`}
    >
      {children}
      {active && (
        <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-gold-500" />
      )}
    </button>
  );
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block w-1.5 h-1.5 rounded-full bg-gold-500"
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
