// Injects a single <style id="design-studio-overrides"> tag that overrides
// CSS variables (per light/dark) and per-selector element styles.

import type { StudioState } from "./store";

const STYLE_ID = "design-studio-overrides";

function toCssProps(styles: Record<string, string>): string {
  return Object.entries(styles)
    .filter(([, v]) => v !== "" && v != null)
    .map(([k, v]) => `${k}: ${v} !important;`)
    .join(" ");
}

function toVarBlock(vars: Record<string, string>): string {
  return Object.entries(vars)
    .filter(([, v]) => v !== "" && v != null)
    .map(([k, v]) => `--${k}: ${v};`)
    .join(" ");
}

export function applyOverrides(state: StudioState): void {
  if (typeof document === "undefined") return;

  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }

  const light = toVarBlock(state.tokens.light);
  const dark = toVarBlock(state.tokens.dark);

  const elementRules = Object.values(state.elements)
    .map((e) => {
      const body = toCssProps(e.styles);
      if (!body) return "";
      // Escape any accidental newlines in the selector
      const safe = e.selector.replace(/\n/g, " ");
      return `${safe} { ${body} }`;
    })
    .filter(Boolean)
    .join("\n");

  el.textContent = `
${light ? `:root { ${light} }` : ""}
${dark ? `html.dark { ${dark} }` : ""}
${elementRules}
`.trim();
}

export function removeOverrides(): void {
  const el = document.getElementById(STYLE_ID);
  if (el) el.remove();
}
