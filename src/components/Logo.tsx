export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <path
          d="M6 24 L16 6 L26 24 Z"
          stroke="#B85C38"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <line
          x1="11"
          y1="24"
          x2="21"
          y2="24"
          stroke="#2C2A28"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-serif text-xl font-semibold tracking-tight text-text">
        ArchImpact
      </span>
    </div>
  );
}
