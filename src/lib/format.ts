export function formatUSD(value: number, opts: { compact?: boolean } = {}): string {
  const { compact = true } = opts;
  if (compact) {
    const abs = Math.abs(value);
    if (abs >= 1_000_000_000)
      return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (abs >= 10_000) return `$${(value / 1_000).toFixed(0)}K`;
    if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDays(d: number): string {
  if (d === 0) return "0d";
  const rounded = Math.round(d * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded}d`;
}

export function formatPct(p: number, digits: number = 0): string {
  return `${(p * 100).toFixed(digits)}%`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function daysBetween(aISO: string, bISO: string): number {
  const a = new Date(aISO).getTime();
  const b = new Date(bISO).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export function severityColor(sev: "low" | "medium" | "high" | "critical"): string {
  switch (sev) {
    case "low":
      return "text-signal-blue";
    case "medium":
      return "text-signal-amber";
    case "high":
      return "text-gold-600";
    case "critical":
      return "text-signal-red";
  }
}

export function categoryColor(
  category: "structural" | "mep" | "finishes" | "financing" | "regulatory" | "schedule"
): string {
  switch (category) {
    case "structural":
      return "#8B7355";
    case "mep":
      return "#5B6B7A";
    case "finishes":
      return "#6B8F71";
    case "financing":
      return "#B85C38";
    case "regulatory":
      return "#C4A574";
    case "schedule":
      return "#4A7C59";
  }
}
