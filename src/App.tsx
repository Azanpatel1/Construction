import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Sparkles } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { InputPanel } from "./components/InputPanel";
import { ResultsView } from "./components/ResultsView";
import { useProjects } from "./hooks/useProjects";
import {
  BLANK_UNIFIED_INPUT,
  runUnifiedAnalysis,
  unifiedInputFromScenario,
  type UnifiedAnalysis,
  type UnifiedInput,
} from "./lib/runAnalysis";

function App() {
  const {
    scenarios,
    activeId,
    activeScenario,
    selectProject,
    createProject,
    deleteProject,
    canDelete,
  } = useProjects();

  const [input, setInput] = useState<UnifiedInput>(() =>
    unifiedInputFromScenario(activeScenario, BLANK_UNIFIED_INPUT)
  );
  const [analysis, setAnalysis] = useState<UnifiedAnalysis | null>(null);
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const projectId = new URLSearchParams(window.location.search).get("project");
    if (projectId && scenarios.some((s) => s.project.id === projectId)) {
      selectProject(projectId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function runAnalysis(final: UnifiedInput) {
    setIsAnalyzing(true);
    setTimeout(() => {
      const result = runUnifiedAnalysis(activeScenario, final);
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
    setInput(unifiedInputFromScenario(activeScenario, BLANK_UNIFIED_INPUT));
    setAnalysis(null);
    setAnalyzedAt(null);
  }

  function switchScenario(id: string) {
    selectProject(id);
    const next = scenarios.find((s) => s.project.id === id) ?? scenarios[0];
    setInput(unifiedInputFromScenario(next, BLANK_UNIFIED_INPUT));
    setAnalysis(null);
    setAnalyzedAt(null);
  }

  function handleCreateProject(name: string, location: string) {
    const created = createProject(name, location);
    setInput(unifiedInputFromScenario(created, BLANK_UNIFIED_INPUT));
    setAnalysis(null);
    setAnalyzedAt(null);
  }

  // Header chip should follow the user's current drawing-confidence rather
  // than the static scenario severity, so the project context reflects the
  // active inputs (or the last analysis, once one is run).
  const headerScenario = useMemo(() => {
    const sev = analysis?.derivedSeverity ?? activeScenario.issue.severity;
    return {
      ...activeScenario,
      issue: { ...activeScenario.issue, severity: sev },
    };
  }, [activeScenario, analysis]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-ink-950 text-text font-sans">
      <Sidebar
        scenarios={scenarios}
        activeId={activeId}
        onSelect={switchScenario}
        onNewProject={handleCreateProject}
        onDeleteProject={deleteProject}
        canDelete={canDelete}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <Header scenario={headerScenario} analyzedAt={analyzedAt} />

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          <InputPanel
            value={input}
            scenarioId={activeId}
            isAnalyzing={isAnalyzing}
            onChange={setInput}
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
                <ReadyToAnalyze />
              </motion.div>
            )}

            {isAnalyzing && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="panel p-12 flex flex-col items-center justify-center gap-3"
              >
                <div className="flex items-center gap-2 text-gold-600 text-sm">
                  <ThinkingDots />
                  Running analysis
                </div>
                <p className="text-xs text-muted">
                  Scoring cascade, schedule, cost, and resource posture
                </p>
              </motion.div>
            )}

            {analysis && !isAnalyzing && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <ResultsView
                  analyst={analysis.analyst}
                  cascade={analysis.cascade}
                  scenario={headerScenario}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <footer className="pt-6 pb-2 text-xs text-muted">
            ArchImpact · Output quality is bound by input quality — provide
            accurate drawings, constraints, and uncertainties for the
            most reliable analysis.
          </footer>
        </div>
      </main>
    </div>
  );
}

function ReadyToAnalyze() {
  return (
    <div className="panel p-10 flex flex-col items-center text-center max-w-2xl mx-auto">
      <div className="p-3 rounded-full bg-ink-800 border border-line">
        <Layers className="w-7 h-7 text-gold-500 stroke-[1.25]" />
      </div>
      <h2 className="mt-5 font-serif text-2xl font-semibold text-text tracking-tight">
        Provide inputs to run the analysis
      </h2>
      <p className="mt-3 text-sm text-muted leading-relaxed max-w-md">
        The dashboard generates results from the drawing, project description,
        and constraints you provide above. Output fidelity scales directly with
        input fidelity.
      </p>
      <div className="mt-6 grid grid-cols-3 gap-3 w-full max-w-md text-left">
        <Hint step="1" label="Drawing" />
        <Hint step="2" label="Project + risk" />
        <Hint step="3" label="Constraints" />
      </div>
      <div className="mt-5 flex items-center gap-1.5 text-xs text-muted">
        <Sparkles className="w-3.5 h-3.5 text-gold-500" />
        Press <span className="kbd">Run analysis</span> when ready
      </div>
    </div>
  );
}

function Hint({ step, label }: { step: string; label: string }) {
  return (
    <div className="rounded-md border border-line bg-ink-800/40 px-3 py-2">
      <div className="text-[10px] text-muted">Step {step}</div>
      <div className="text-xs font-medium text-text mt-0.5">{label}</div>
    </div>
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
