import { Play, Sparkles } from "lucide-react";

interface Props {
  onRun: () => void;
}

export function EmptyState({ onRun }: Props) {
  return (
    <div className="panel p-10 flex flex-col items-center text-center">
      <div className="p-3 rounded-full bg-gold-500/10 border border-gold-500/30">
        <Sparkles className="w-6 h-6 text-gold-500" />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-text tracking-tight">
        Quantify the cost of being wrong on paper.
      </h2>
      <p className="mt-2 max-w-lg text-[13px] text-muted leading-relaxed">
        Model the downstream impact of architectural inaccuracies before they
        hit your balance sheet. Adjust the constraints above, then run the
        impact model to see the optimized mitigation path.
      </p>
      <button onClick={onRun} className="btn-primary mt-5">
        <Play className="w-3.5 h-3.5" /> Run impact model
      </button>
    </div>
  );
}
