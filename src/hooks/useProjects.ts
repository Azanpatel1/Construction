import { useCallback, useMemo, useState } from "react";
import { allScenarios as builtInScenarios } from "../lib/scenarios";
import {
  createBlankScenario,
  isBuiltInProject,
} from "../lib/projectFactory";
import type { Scenario } from "../lib/types";

const STORAGE_KEY = "archimpact-custom-projects";

function loadCustomScenarios(): Scenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Scenario[];
    return Array.isArray(parsed) ? parsed.filter((s) => s?.project?.id) : [];
  } catch {
    return [];
  }
}

function saveCustomScenarios(custom: Scenario[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
}

export function useProjects() {
  const [customScenarios, setCustomScenarios] = useState<Scenario[]>(loadCustomScenarios);
  const [activeId, setActiveId] = useState<string>(builtInScenarios[0].project.id);

  const scenarios = useMemo(
    () => [...builtInScenarios, ...customScenarios],
    [customScenarios]
  );

  const activeScenario = useMemo(
    () => scenarios.find((s) => s.project.id === activeId) ?? scenarios[0],
    [scenarios, activeId]
  );

  const createProject = useCallback((name: string, location: string) => {
    const next = createBlankScenario(name, location);
    setCustomScenarios((prev) => {
      const updated = [...prev, next];
      saveCustomScenarios(updated);
      return updated;
    });
    setActiveId(next.project.id);
    return next;
  }, []);

  const deleteProject = useCallback((id: string) => {
    if (isBuiltInProject(id)) return false;
    setCustomScenarios((prev) => {
      const updated = prev.filter((s) => s.project.id !== id);
      saveCustomScenarios(updated);
      setActiveId((current) => {
        if (current !== id) return current;
        const remaining = [...builtInScenarios, ...updated];
        return remaining[0]?.project.id ?? builtInScenarios[0].project.id;
      });
      return updated;
    });
    return true;
  }, []);

  const selectProject = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  return {
    scenarios,
    activeId,
    activeScenario,
    selectProject,
    createProject,
    deleteProject,
    canDelete: (id: string) => !isBuiltInProject(id),
  };
}
