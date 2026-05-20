import { useState, useRef, useEffect } from "react";
import {
  Building2,
  MoreVertical,
  Plus,
  Share2,
  Trash2,
  Check,
} from "lucide-react";
import type { Scenario } from "../lib/types";
import { formatUSD, severityColor } from "../lib/format";
import { projectShareText } from "../lib/projectFactory";
import { Logo } from "./Logo";
import { NewProjectModal } from "./NewProjectModal";

interface SidebarProps {
  scenarios: Scenario[];
  activeId: string;
  onSelect: (id: string) => void;
  onNewProject: (name: string, location: string) => void;
  onDeleteProject: (id: string) => void;
  canDelete: (id: string) => boolean;
}

export function Sidebar({
  scenarios,
  activeId,
  onSelect,
  onNewProject,
  onDeleteProject,
  canDelete,
}: SidebarProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState(false);

  return (
    <>
      <aside className="w-[240px] shrink-0 border-r border-line bg-ink-850 flex flex-col">
        <div className="px-5 py-6 border-b border-line">
          <Logo />
          <p className="mt-2 text-xs text-muted leading-relaxed">
            Impact analysis for drawing discrepancies
          </p>
        </div>

        <div className="px-4 pt-4 pb-2">
          <span className="text-xs font-medium text-muted">Projects</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 space-y-1">
          {scenarios.map((s) => (
            <ProjectCard
              key={s.project.id}
              scenario={s}
              active={s.project.id === activeId}
              menuOpen={menuId === s.project.id}
              onSelect={() => onSelect(s.project.id)}
              onMenuToggle={() =>
                setMenuId((id) => (id === s.project.id ? null : s.project.id))
              }
              onMenuClose={() => setMenuId(null)}
              onShare={async () => {
                setMenuId(null);
                const text = projectShareText(s);
                try {
                  if (navigator.share) {
                    await navigator.share({
                      title: s.project.name,
                      text,
                    });
                  } else {
                    await navigator.clipboard.writeText(text);
                    setShareToast(true);
                    setTimeout(() => setShareToast(false), 2000);
                  }
                } catch {
                  /* user cancelled share */
                }
              }}
              onDelete={() => {
                setMenuId(null);
                if (canDelete(s.project.id)) {
                  if (
                    window.confirm(
                      `Delete "${s.project.name}"? This cannot be undone.`
                    )
                  ) {
                    onDeleteProject(s.project.id);
                  }
                }
              }}
              canDelete={canDelete(s.project.id)}
            />
          ))}
        </nav>

        <div className="p-3 border-t border-line">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-md border border-dashed border-line py-2.5 text-sm font-medium text-muted hover:text-gold-600 hover:border-gold-500/40 hover:bg-gold-500/5 transition"
          >
            <Plus className="w-4 h-4" />
            New project
          </button>
          {shareToast && (
            <p className="mt-2 flex items-center justify-center gap-1 text-xs text-signal-green">
              <Check className="w-3 h-3" /> Link copied
            </p>
          )}
        </div>
      </aside>

      <NewProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={(name, location) => {
          onNewProject(name, location);
          setModalOpen(false);
        }}
      />
    </>
  );
}

function ProjectCard({
  scenario,
  active,
  menuOpen,
  onSelect,
  onMenuToggle,
  onMenuClose,
  onShare,
  onDelete,
  canDelete,
}: {
  scenario: Scenario;
  active: boolean;
  menuOpen: boolean;
  onSelect: () => void;
  onMenuToggle: () => void;
  onMenuClose: () => void;
  onShare: () => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { project, issue } = scenario;

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onMenuClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen, onMenuClose]);

  return (
    <div
      className={`relative rounded-md border transition ${
        active
          ? "bg-ink-800/80 border-gold-500/30 shadow-glow"
          : "border-transparent hover:bg-ink-800/50"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="w-full text-left px-3 py-2.5 pr-9"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Building2
            className={`w-3.5 h-3.5 shrink-0 ${
              active ? "text-gold-500" : "text-muted"
            }`}
          />
          <span className="text-sm font-medium text-text truncate leading-snug">
            {project.name}
          </span>
        </div>
        <div className="mt-1 ml-5 text-xs text-muted truncate">
          {project.location}
        </div>
        <div className="mt-1.5 ml-5 flex items-center gap-2">
          <span className="text-xs tabular-nums text-muted">
            {formatUSD(project.totalBudgetUSD)}
          </span>
          <span
            className={`text-[10px] font-medium capitalize px-1.5 py-0.5 rounded-full border border-line ${severityColor(
              issue.severity
            )}`}
          >
            {issue.severity}
          </span>
        </div>
      </button>

      <div ref={menuRef} className="absolute top-2 right-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMenuToggle();
          }}
          className="p-1 rounded text-muted hover:text-text hover:bg-ink-800 transition"
          aria-label="Project options"
          aria-expanded={menuOpen}
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-0.5 z-20 min-w-[140px] rounded-md border border-line bg-ink-850 py-1 shadow-soft">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShare();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-ink-800 transition text-left"
            >
              <Share2 className="w-3.5 h-3.5 text-muted" />
              Share
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              disabled={!canDelete}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition ${
                canDelete
                  ? "text-signal-red hover:bg-signal-red/5"
                  : "text-muted/50 cursor-not-allowed"
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
