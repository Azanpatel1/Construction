export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6 24 L16 6 L26 24 Z"
          stroke="#D4A24C"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <line
          x1="11"
          y1="24"
          x2="21"
          y2="24"
          stroke="#D4A24C"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="16" cy="15" r="1.6" fill="#D4A24C" />
      </svg>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[15px] font-semibold tracking-tight text-text">
          ArchImpact
        </span>
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted">
          v0.1
        </span>
      </div>
    </div>
  );
}
