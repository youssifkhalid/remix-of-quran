// Persistent store for the Design Studio. Everything lives in localStorage
// under one key. No backend — this is an owner-only visual editor.

const STORAGE_KEY = "sakeenah:design-studio:v1";
const ENABLED_KEY = "sakeenah:design-studio:enabled";

export type Mode = "light" | "dark";

export interface ElementStyle {
  selector: string;
  label?: string;
  styles: Record<string, string>; // CSS property -> value
}

export interface StudioState {
  tokens: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
  elements: Record<string, ElementStyle>; // keyed by selector
}

const EMPTY_STATE: StudioState = {
  tokens: { light: {}, dark: {} },
  elements: {},
};

/* ── Enablement (owner unlock) ── */
export function isStudioEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (new URLSearchParams(window.location.search).get("studio") === "1") {
      localStorage.setItem(ENABLED_KEY, "1");
      return true;
    }
    if (new URLSearchParams(window.location.search).get("studio") === "0") {
      localStorage.removeItem(ENABLED_KEY);
      return false;
    }
    return localStorage.getItem(ENABLED_KEY) === "1";
  } catch {
    return false;
  }
}

/* ── State I/O ── */
export function loadState(): StudioState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(EMPTY_STATE);
    const parsed = JSON.parse(raw);
    return {
      tokens: {
        light: parsed?.tokens?.light ?? {},
        dark: parsed?.tokens?.dark ?? {},
      },
      elements: parsed?.elements ?? {},
    };
  } catch {
    return structuredClone(EMPTY_STATE);
  }
}

export function saveState(state: StudioState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota etc — silent */
  }
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* noop */ }
}

/* ── Exports for backup ── */
export function exportState(): string {
  return JSON.stringify(loadState(), null, 2);
}

export function importState(json: string): StudioState {
  const parsed = JSON.parse(json);
  const merged: StudioState = {
    tokens: {
      light: parsed?.tokens?.light ?? {},
      dark: parsed?.tokens?.dark ?? {},
    },
    elements: parsed?.elements ?? {},
  };
  saveState(merged);
  return merged;
}
