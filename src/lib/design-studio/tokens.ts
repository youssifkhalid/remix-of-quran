// Catalog of editable design tokens. Each token maps to a CSS variable
// defined in src/styles.css. Grouped by category for the panel UI.

export type TokenType = "color" | "text" | "number";

export interface TokenDef {
  key: string;         // CSS variable name (without --)
  label: string;       // Arabic label shown to the owner
  type: TokenType;
  category: string;
  hint?: string;
}

export const TOKENS: TokenDef[] = [
  // ── Colors ──
  { key: "background",         label: "خلفية الصفحة",       type: "color", category: "الألوان الأساسية" },
  { key: "foreground",         label: "لون النص العام",     type: "color", category: "الألوان الأساسية" },
  { key: "primary",            label: "اللون الأساسي",      type: "color", category: "الألوان الأساسية" },
  { key: "primary-foreground", label: "نص على الأساسي",     type: "color", category: "الألوان الأساسية" },
  { key: "primary-glow",       label: "توهج الأساسي",       type: "color", category: "الألوان الأساسية" },
  { key: "gold",               label: "الذهبي",             type: "color", category: "الألوان الأساسية" },
  { key: "gold-foreground",    label: "نص على الذهبي",      type: "color", category: "الألوان الأساسية" },

  { key: "card",               label: "خلفية الكارت",       type: "color", category: "الأسطح" },
  { key: "card-foreground",    label: "نص الكارت",          type: "color", category: "الأسطح" },
  { key: "surface",            label: "السطح",              type: "color", category: "الأسطح" },
  { key: "surface-elevated",   label: "السطح المرتفع",      type: "color", category: "الأسطح" },
  { key: "muted",              label: "خلفية باهتة",        type: "color", category: "الأسطح" },
  { key: "muted-foreground",   label: "نص باهت",            type: "color", category: "الأسطح" },
  { key: "accent",             label: "لهجة",               type: "color", category: "الأسطح" },
  { key: "accent-foreground",  label: "نص اللهجة",          type: "color", category: "الأسطح" },
  { key: "border",             label: "لون الحواف",         type: "color", category: "الأسطح" },
  { key: "input",              label: "خلفية الإدخال",      type: "color", category: "الأسطح" },
  { key: "ring",               label: "خط التركيز",         type: "color", category: "الأسطح" },
  { key: "destructive",        label: "لون الخطر",          type: "color", category: "الأسطح" },

  // ── Typography ──
  { key: "font-sans",    label: "خط الواجهة",   type: "text", category: "الخطوط",
    hint: 'مثال: "IBM Plex Sans Arabic", Cairo, sans-serif' },
  { key: "font-arabic",  label: "خط القرآن",     type: "text", category: "الخطوط" },
  { key: "font-display", label: "خط العناوين",   type: "text", category: "الخطوط" },

  // ── Radii ──
  { key: "radius", label: "نصف قطر الحواف (px/rem)", type: "text", category: "الأبعاد",
    hint: "مثال: 1.1rem أو 16px" },

  // ── Gradients ──
  { key: "g-primary", label: "تدرّج الأساسي", type: "text", category: "التدرّجات",
    hint: "linear-gradient(...)" },
  { key: "g-hero",    label: "تدرّج البانر",  type: "text", category: "التدرّجات" },
  { key: "g-gold",    label: "تدرّج ذهبي",    type: "text", category: "التدرّجات" },
  { key: "g-card",    label: "تدرّج الكارت",  type: "text", category: "التدرّجات" },

  // ── Shadows ──
  { key: "shadow-soft",     label: "ظل ناعم",      type: "text", category: "الظلال" },
  { key: "shadow-elevated", label: "ظل مرتفع",     type: "text", category: "الظلال" },
  { key: "shadow-glow",     label: "ظل متوهّج",    type: "text", category: "الظلال" },
];

export const TOKEN_CATEGORIES = Array.from(new Set(TOKENS.map((t) => t.category)));
