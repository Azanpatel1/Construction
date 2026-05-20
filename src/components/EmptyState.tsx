import { Play, Layers } from "lucide-react";

interface Props {
  onRun: () => void;
}

export function EmptyState({ onRun }: Props) {
  return (
    <div className="panel p-12 flex flex-col items-center text-center max-w-xl mx-auto">
      <div className="p-4 rounded-full bg-ink-800 border border-line">
        <Layers className="w-8 h-8 text-gold-500 stroke-[1.25]" />
      </div>
      <h2 className="mt-6 font-serif text-2xl font-semibold text-text tracking-tight">
        Model the impact before it spreads
      </h2>
      <p className="mt-3 text-sm text-muted leading-relaxed">
        When a drawing doesn&apos;t match the build, costs cascade through
        structure, MEP, schedule, and financing. Set your constraints above,
        then run the analysis.
      </p>
      <button onClick={onRun} className="btn-primary mt-8">
        <Play className="w-4 h-4" /> Run analysis
      </button>
    </div>
  );
}
