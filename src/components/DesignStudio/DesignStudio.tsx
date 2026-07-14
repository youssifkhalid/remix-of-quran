import { useEffect, useMemo, useRef, useState } from "react";
import {
  Palette, X, MousePointerClick, Type as TypeIcon, Ruler, Sparkles,
  Download, Upload, RotateCcw, Sun, Moon, Trash2, ChevronDown, ChevronRight,
  Eye, EyeOff,
} from "lucide-react";
import { TOKENS, TOKEN_CATEGORIES, type TokenDef } from "@/lib/design-studio/tokens";
import {
  loadState, saveState, clearState, exportState, importState,
  isStudioEnabled, type StudioState, type Mode,
} from "@/lib/design-studio/store";
import { applyOverrides } from "@/lib/design-studio/apply";
import { buildSelector, describeElement } from "@/lib/design-studio/selector";

/* ────────── Owner-only mount ────────── */
export function DesignStudio() {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);

  // Initial enable + apply saved overrides ASAP
  useEffect(() => {
    const on = isStudioEnabled();
    setEnabled(on);
    // Apply overrides regardless — the user's customizations should always
    // render, whether or not the studio panel is currently visible.
    applyOverrides(loadState());
  }, []);

  // Keyboard shortcut: Ctrl/Cmd + Shift + D
  useEffect(() => {
    if (!enabled) return;
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-3 z-[9998] grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white shadow-2xl ring-2 ring-white/20 hover:scale-105 transition"
          aria-label="فتح استوديو التصميم"
          title="Design Studio (Ctrl+Shift+D)"
        >
          <Palette className="h-5 w-5" />
        </button>
      )}
      {open && <StudioPanel onClose={() => setOpen(false)} />}
    </>
  );
}

/* ────────── Main panel ────────── */
type Tab = "tokens" | "inspect";

function StudioPanel({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<StudioState>(() => loadState());
  const [mode, setMode] = useState<Mode>(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
      ? "dark" : "light",
  );
  const [tab, setTab] = useState<Tab>("tokens");
  const [inspectOn, setInspectOn] = useState(false);
  const [pickedSelector, setPickedSelector] = useState<string | null>(null);
  const [pickedLabel, setPickedLabel] = useState<string>("");

  // Persist + apply on every change
  useEffect(() => {
    saveState(state);
    applyOverrides(state);
  }, [state]);

  // Sync mode with actual html.dark
  function toggleMode() {
    const html = document.documentElement;
    const nextDark = !html.classList.contains("dark");
    html.classList.toggle("dark", nextDark);
    try { localStorage.setItem("sakeenah:theme", nextDark ? "dark" : "light"); } catch {}
    setMode(nextDark ? "dark" : "light");
  }

  /* ── Token editing ── */
  function setToken(key: string, value: string) {
    setState((s) => ({
      ...s,
      tokens: {
        ...s.tokens,
        [mode]: { ...s.tokens[mode], [key]: value },
      },
    }));
  }
  function resetToken(key: string) {
    setState((s) => {
      const copy = { ...s.tokens[mode] };
      delete copy[key];
      return { ...s, tokens: { ...s.tokens, [mode]: copy } };
    });
  }
  function currentValue(key: string): string {
    const stored = state.tokens[mode][key];
    if (stored != null) return stored;
    if (typeof document === "undefined") return "";
    return getComputedStyle(document.documentElement).getPropertyValue(`--${key}`).trim();
  }

  /* ── Element editing ── */
  function setElStyle(selector: string, label: string, prop: string, val: string) {
    setState((s) => {
      const prev = s.elements[selector] ?? { selector, label, styles: {} };
      const styles = { ...prev.styles };
      if (val === "") delete styles[prop]; else styles[prop] = val;
      const next = { ...prev, label: prev.label ?? label, styles };
      const elements = { ...s.elements };
      if (Object.keys(styles).length === 0) delete elements[selector];
      else elements[selector] = next;
      return { ...s, elements };
    });
  }
  function deleteElement(selector: string) {
    setState((s) => {
      const elements = { ...s.elements };
      delete elements[selector];
      return { ...s, elements };
    });
    if (pickedSelector === selector) setPickedSelector(null);
  }

  /* ── Reset / export / import ── */
  function fullReset() {
    if (!confirm("مسح كل تعديلات التصميم؟ لا يمكن التراجع.")) return;
    clearState();
    setState({ tokens: { light: {}, dark: {} }, elements: {} });
  }
  function doExport() {
    const blob = new Blob([exportState()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sakeenah-theme-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  }
  const fileRef = useRef<HTMLInputElement>(null);
  function doImport(f: File) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const next = importState(String(r.result));
        setState(next);
        alert("تم استيراد الثيم ✓");
      } catch { alert("ملف غير صالح"); }
    };
    r.readAsText(f);
  }

  /* ── Inspector overlay ── */
  useInspector(inspectOn, (selector, label) => {
    setPickedSelector(selector);
    setPickedLabel(label);
    setTab("inspect");
    setInspectOn(false);
  });

  return (
    <div
      dir="rtl"
      className="fixed inset-y-0 left-0 z-[9999] flex w-[380px] max-w-[92vw] flex-col border-r border-black/10 bg-white text-slate-900 shadow-2xl"
      style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black/10 bg-gradient-to-l from-fuchsia-500 to-violet-600 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          <div>
            <p className="text-sm font-bold leading-none">استوديو التصميم</p>
            <p className="mt-1 text-[10px] opacity-80 leading-none">تحكّم كامل بدون كود</p>
          </div>
        </div>
        <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 hover:bg-white/25" aria-label="إغلاق">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-black/10 bg-slate-50 p-2">
        <button
          onClick={() => setTab("tokens")}
          className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold ${tab === "tokens" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-200"}`}
        >
          <Sparkles className="inline h-3.5 w-3.5 ml-1" />
          توكنز عامة
        </button>
        <button
          onClick={() => setTab("inspect")}
          className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold ${tab === "inspect" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-200"}`}
        >
          <MousePointerClick className="inline h-3.5 w-3.5 ml-1" />
          فاحص العناصر
        </button>
        <button
          onClick={toggleMode}
          className="grid h-8 w-8 place-items-center rounded-lg bg-slate-200 hover:bg-slate-300"
          title={`الوضع: ${mode === "dark" ? "داكن" : "فاتح"}`}
        >
          {mode === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3">
        {tab === "tokens" ? (
          <TokensView
            state={state}
            mode={mode}
            currentValue={currentValue}
            setToken={setToken}
            resetToken={resetToken}
          />
        ) : (
          <InspectView
            inspectOn={inspectOn}
            setInspectOn={setInspectOn}
            pickedSelector={pickedSelector}
            pickedLabel={pickedLabel}
            elements={state.elements}
            setElStyle={setElStyle}
            deleteElement={deleteElement}
            onPick={(s, l) => { setPickedSelector(s); setPickedLabel(l); }}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-1.5 border-t border-black/10 bg-slate-50 p-2">
        <button onClick={doExport} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white border border-slate-300 px-2 py-1.5 text-[11px] font-semibold hover:bg-slate-100">
          <Download className="h-3.5 w-3.5" /> تصدير
        </button>
        <button onClick={() => fileRef.current?.click()} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white border border-slate-300 px-2 py-1.5 text-[11px] font-semibold hover:bg-slate-100">
          <Upload className="h-3.5 w-3.5" /> استيراد
        </button>
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
        <button onClick={fullReset} className="flex items-center justify-center gap-1 rounded-lg bg-rose-500 text-white px-2 py-1.5 text-[11px] font-semibold hover:bg-rose-600">
          <RotateCcw className="h-3.5 w-3.5" /> إعادة تعيين
        </button>
      </div>
    </div>
  );
}

/* ────────── Tokens tab ────────── */
function TokensView({
  state, mode, currentValue, setToken, resetToken,
}: {
  state: StudioState; mode: Mode;
  currentValue: (k: string) => string;
  setToken: (k: string, v: string) => void;
  resetToken: (k: string) => void;
}) {
  const [openCats, setOpenCats] = useState<Record<string, boolean>>(
    () => Object.fromEntries(TOKEN_CATEGORIES.map((c, i) => [c, i < 2])),
  );

  return (
    <div className="space-y-2">
      <p className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-[11px] text-amber-800">
        الوضع الحالي: <b>{mode === "dark" ? "الداكن" : "الفاتح"}</b>. أي تعديل يُطبَّق على هذا الوضع فقط. بدّل الوضع من الزر أعلى.
      </p>
      {TOKEN_CATEGORIES.map((cat) => {
        const isOpen = openCats[cat];
        const items = TOKENS.filter((t) => t.category === cat);
        return (
          <div key={cat} className="rounded-xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => setOpenCats((s) => ({ ...s, [cat]: !s[cat] }))}
              className="flex w-full items-center justify-between bg-slate-100 px-3 py-2 text-xs font-bold hover:bg-slate-200"
            >
              <span>{cat}</span>
              {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
            {isOpen && (
              <div className="divide-y divide-slate-100">
                {items.map((t) => (
                  <TokenRow key={t.key} def={t}
                    value={currentValue(t.key)}
                    isOverride={state.tokens[mode][t.key] != null}
                    onChange={(v) => setToken(t.key, v)}
                    onReset={() => resetToken(t.key)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TokenRow({ def, value, isOverride, onChange, onReset }: {
  def: TokenDef; value: string; isOverride: boolean;
  onChange: (v: string) => void; onReset: () => void;
}) {
  return (
    <div className="p-2.5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="text-[11px] font-semibold text-slate-700">{def.label}</label>
        {isOverride && (
          <button onClick={onReset} className="text-[10px] text-rose-600 hover:underline">↺ افتراضي</button>
        )}
      </div>
      {def.type === "color" ? (
        <ColorInput value={value} onChange={onChange} />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={def.hint}
          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-[11px] outline-none focus:border-violet-500"
        />
      )}
      {def.hint && def.type !== "color" && (
        <p className="mt-1 text-[9px] text-slate-500">{def.hint}</p>
      )}
    </div>
  );
}

/* Handles hex, rgb, oklch — for oklch we fallback to text input + a
   visual swatch. Native color picker only supports hex, so we sync back. */
function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const isOklch = /oklch/i.test(value);
  const isHex = /^#[0-9a-f]{3,8}$/i.test(value.trim());

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="h-8 w-8 shrink-0 rounded-lg border border-slate-300"
        style={{ background: value || "transparent" }}
      />
      {!isOklch && (
        <input
          type="color"
          value={isHex ? value.trim() : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 shrink-0 cursor-pointer rounded border border-slate-300"
        />
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-[11px] font-mono outline-none focus:border-violet-500"
      />
    </div>
  );
}

/* ────────── Inspector tab ────────── */
function InspectView({
  inspectOn, setInspectOn, pickedSelector, pickedLabel,
  elements, setElStyle, deleteElement, onPick,
}: {
  inspectOn: boolean; setInspectOn: (v: boolean) => void;
  pickedSelector: string | null; pickedLabel: string;
  elements: Record<string, { selector: string; label?: string; styles: Record<string, string> }>;
  setElStyle: (sel: string, label: string, prop: string, val: string) => void;
  deleteElement: (sel: string) => void;
  onPick: (sel: string, label: string) => void;
}) {
  const currentStyles = useMemo(
    () => (pickedSelector ? elements[pickedSelector]?.styles ?? {} : {}),
    [pickedSelector, elements],
  );

  return (
    <div className="space-y-3">
      <button
        onClick={() => setInspectOn(!inspectOn)}
        className={`flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
          inspectOn
            ? "bg-rose-500 text-white shadow-lg ring-2 ring-rose-300"
            : "bg-violet-600 text-white shadow hover:bg-violet-700"
        }`}
      >
        {inspectOn ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        {inspectOn ? "إيقاف التحديد (Esc)" : "اضغط لبدء التحديد ثم اختر عنصرًا"}
      </button>

      {pickedSelector ? (
        <div className="rounded-xl border border-violet-300 bg-violet-50 p-2.5">
          <p className="text-[10px] font-bold text-violet-800 mb-1">العنصر المحدد</p>
          <p className="text-[11px] font-mono text-slate-700 break-all">{pickedLabel}</p>
          <p className="mt-1 text-[9px] font-mono text-slate-500 break-all">{pickedSelector}</p>
        </div>
      ) : (
        <p className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center text-[11px] text-slate-500">
          فعّل التحديد فوق ثم اضغط على أي عنصر داخل التطبيق.
        </p>
      )}

      {pickedSelector && (
        <div className="space-y-2 rounded-xl border border-slate-200 p-2">
          <p className="text-[10px] font-bold text-slate-600 uppercase">تعديلات على هذا العنصر</p>
          <StyleField label="لون النص" prop="color" type="color"
            value={currentStyles["color"] ?? ""} onChange={(v) => setElStyle(pickedSelector, pickedLabel, "color", v)} />
          <StyleField label="لون الخلفية" prop="background" type="color"
            value={currentStyles["background"] ?? ""} onChange={(v) => setElStyle(pickedSelector, pickedLabel, "background", v)} />
          <StyleField label="حجم الخط" prop="font-size" type="text"
            value={currentStyles["font-size"] ?? ""} placeholder="مثال: 16px، 1.2rem"
            onChange={(v) => setElStyle(pickedSelector, pickedLabel, "font-size", v)} />
          <StyleField label="سماكة الخط" prop="font-weight" type="text"
            value={currentStyles["font-weight"] ?? ""} placeholder="400، 600، 800"
            onChange={(v) => setElStyle(pickedSelector, pickedLabel, "font-weight", v)} />
          <StyleField label="نصف قطر الحواف" prop="border-radius" type="text"
            value={currentStyles["border-radius"] ?? ""} placeholder="مثال: 12px، 9999px"
            onChange={(v) => setElStyle(pickedSelector, pickedLabel, "border-radius", v)} />
          <StyleField label="الحشو الداخلي (padding)" prop="padding" type="text"
            value={currentStyles["padding"] ?? ""} placeholder="مثال: 12px 20px"
            onChange={(v) => setElStyle(pickedSelector, pickedLabel, "padding", v)} />
          <StyleField label="الهامش الخارجي (margin)" prop="margin" type="text"
            value={currentStyles["margin"] ?? ""} placeholder="مثال: 8px 0"
            onChange={(v) => setElStyle(pickedSelector, pickedLabel, "margin", v)} />
          <StyleField label="الحدود" prop="border" type="text"
            value={currentStyles["border"] ?? ""} placeholder="مثال: 1px solid #ddd"
            onChange={(v) => setElStyle(pickedSelector, pickedLabel, "border", v)} />
          <StyleField label="الظل" prop="box-shadow" type="text"
            value={currentStyles["box-shadow"] ?? ""} placeholder="0 4px 12px rgba(0,0,0,0.1)"
            onChange={(v) => setElStyle(pickedSelector, pickedLabel, "box-shadow", v)} />
          <StyleField label="الشفافية" prop="opacity" type="text"
            value={currentStyles["opacity"] ?? ""} placeholder="0 - 1"
            onChange={(v) => setElStyle(pickedSelector, pickedLabel, "opacity", v)} />
          <StyleField label="محاذاة النص" prop="text-align" type="text"
            value={currentStyles["text-align"] ?? ""} placeholder="right، center، left"
            onChange={(v) => setElStyle(pickedSelector, pickedLabel, "text-align", v)} />
          <StyleField label="العرض (display)" prop="display" type="text"
            value={currentStyles["display"] ?? ""} placeholder="none لإخفاء العنصر"
            onChange={(v) => setElStyle(pickedSelector, pickedLabel, "display", v)} />

          {Object.keys(currentStyles).length > 0 && (
            <button
              onClick={() => deleteElement(pickedSelector)}
              className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-rose-100 text-rose-700 py-1.5 text-[11px] font-semibold hover:bg-rose-200"
            >
              <Trash2 className="h-3.5 w-3.5" /> حذف كل تعديلات هذا العنصر
            </button>
          )}
        </div>
      )}

      {Object.keys(elements).length > 0 && (
        <div className="rounded-xl border border-slate-200 p-2">
          <p className="text-[10px] font-bold text-slate-600 uppercase mb-2">كل العناصر المعدّلة ({Object.keys(elements).length})</p>
          <ul className="space-y-1">
            {Object.values(elements).map((e) => (
              <li key={e.selector}>
                <button
                  onClick={() => onPick(e.selector, e.label ?? e.selector)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[10px] font-mono text-left ${
                    pickedSelector === e.selector ? "bg-violet-100 text-violet-800" : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <span className="truncate">{e.label ?? e.selector}</span>
                  <span className="shrink-0 rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px]">{Object.keys(e.styles).length}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StyleField({ label, type, value, onChange, placeholder }: {
  label: string; prop: string; type: "color" | "text";
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold text-slate-600">{label}</label>
      {type === "color" ? (
        <ColorInput value={value} onChange={onChange} />
      ) : (
        <input
          type="text" value={value} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-[11px] outline-none focus:border-violet-500"
        />
      )}
    </div>
  );
}

/* ────────── Inspector overlay (highlight on hover, click to pick) ────────── */
function useInspector(on: boolean, onPick: (selector: string, label: string) => void) {
  useEffect(() => {
    if (!on) return;

    const highlight = document.createElement("div");
    highlight.style.cssText = `
      position: fixed; pointer-events: none; z-index: 9997;
      border: 2px solid #a855f7; background: rgba(168,85,247,0.12);
      border-radius: 6px; transition: all 60ms ease-out;
      box-shadow: 0 0 0 9999px rgba(0,0,0,0.02);
    `;
    document.body.appendChild(highlight);

    const label = document.createElement("div");
    label.style.cssText = `
      position: fixed; z-index: 9997; pointer-events: none;
      background: #7c3aed; color: white; font-size: 11px;
      padding: 3px 8px; border-radius: 6px; font-family: monospace;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(label);

    function onMove(e: MouseEvent) {
      const el = e.target as Element;
      if (!el || !(el instanceof Element)) return;
      // Don't highlight the studio itself
      if (el.closest("[data-ds-panel]")) { highlight.style.display = "none"; label.style.display = "none"; return; }
      highlight.style.display = "block"; label.style.display = "block";
      const r = el.getBoundingClientRect();
      highlight.style.top = `${r.top}px`;
      highlight.style.left = `${r.left}px`;
      highlight.style.width = `${r.width}px`;
      highlight.style.height = `${r.height}px`;
      label.textContent = describeElement(el);
      label.style.top = `${Math.max(4, r.top - 24)}px`;
      label.style.left = `${r.left}px`;
    }

    function onClick(e: MouseEvent) {
      const el = e.target as Element;
      if (!el || !(el instanceof Element)) return;
      if (el.closest("[data-ds-panel]")) return;
      e.preventDefault(); e.stopPropagation();
      const sel = buildSelector(el);
      onPick(sel, describeElement(el));
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onPick("", "");
    }

    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKey, true);
      highlight.remove();
      label.remove();
    };
  }, [on, onPick]);
}
