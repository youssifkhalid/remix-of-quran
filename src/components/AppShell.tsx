import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen, Home, MoonStar, Sparkles, Bot, Search,
  Compass, BookMarked, Trophy, Map,
  Settings, Heart, Star, CalendarDays, Mic2,
  Radio, Moon, Flame, LogIn, Menu, X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import { MiniPlayer } from "@/components/MiniPlayer";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { DesignStudio } from "@/components/DesignStudio/DesignStudio";
import { SakinahLogo } from "@/components/SakinahLogo";

/* ═══════════════════════════════════════════════════════════════════
   NAVIGATION — flat, single-hierarchy, Egyptian-friendly copy.
   Bottom tab bar = the 5 things people open most. Everything else
   lives one tap away in "المزيد" (not a stiff "القائمة/الإعدادات").
   ═══════════════════════════════════════════════════════════════════ */
const TABS = [
  { to: "/",        icon: Home,     label: "الرئيسية" },
  { to: "/quran",   icon: BookOpen, label: "القرآن" },
  { to: "/ai-chat", icon: Bot,      label: "المساعد", badge: true },
  { to: "/prayer",  icon: MoonStar, label: "الصلاة" },
  { to: "/adhkar",  icon: Sparkles, label: "الأذكار" },
] as const;

const MORE_SECTIONS = [
  { title: "القرآن والذكر", items: [
    { to: "/search",    icon: Search,     label: "دور على أي حاجة" },
    { to: "/hadith",    icon: BookOpen,   label: "مكتبة الحديث" },
    { to: "/dua",       icon: Heart,      label: "الأدعية" },
    { to: "/radio",     icon: Radio,      label: "إذاعة القرآن" },
    { to: "/reciters",  icon: Mic2,       label: "الشيوخ والقُرّاء" },
  ]},
  { title: "عبادتك اليومية", items: [
    { to: "/wird",      icon: Flame,      label: "الورد اليومي" },
    { to: "/khatmah",   icon: Trophy,     label: "ختمة القرآن" },
    { to: "/fasting",   icon: Moon,       label: "صيام رمضان" },
    { to: "/qibla",     icon: Compass,    label: "اتجاه القبلة" },
    { to: "/bookmarks", icon: BookMarked, label: "الإشارات المرجعية" },
  ]},
  { title: "أدوات ", items: [
    { to: "/calendar",  icon: CalendarDays, label: "التقويم الهجري" },
    { to: "/names",     icon: Star,         label: "أسماء الله الحسنى" },
    { to: "/tools",     icon: Map,          label: "أدوات إسلامية" },
    { to: "/settings",  icon: Settings,     label: "الإعدادات" },
  ]},
] as const;

type NavEntry = { to: string; icon: any; label: string };
const ALL_MORE: NavEntry[] = MORE_SECTIONS.flatMap((s) => [...s.items]);

/* ─── Keyboard shortcuts (desktop) ─── */
function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const inInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (inInput) return;
      if (e.metaKey || e.ctrlKey) {
        const map: Record<string, string> = { k: "/search", q: "/quran", a: "/ai-chat", p: "/prayer", h: "/", d: "/adhkar" };
        if (map[e.key]) { e.preventDefault(); window.location.href = map[e.key]; }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}

/* ─── Sidebar nav row (desktop) ─── */
function SideNavItem({ to, icon: Icon, label, active }: { to: string; icon: any; label: string; active: boolean }) {
  return (
    <Link
      to={to as any}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] transition-colors duration-150 ${
        active ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-accent"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.4 : 1.8} />
      <span className="flex-1 leading-none truncate">{label}</span>
    </Link>
  );
}

function ProfilePill() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) {
    return (
      <Link to="/auth" className="flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-xs font-semibold text-foreground hover:border-primary/50 transition-colors">
        <LogIn className="h-3.5 w-3.5" />
        سجّل دخولك
      </Link>
    );
  }
  const initial = (user.email ?? "?")[0]?.toUpperCase();
  return (
    <Link to="/profile" className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-2.5 py-2 hover:border-primary/50 transition-colors">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">{initial}</span>
      <span className="text-xs font-semibold truncate">{user.email}</span>
    </Link>
  );
}

/* ─── Brand mark: shared by sidebar + mobile bar + drawer ─── */
function Brand({ size = 36, compact = false }: { size?: number; compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 min-w-0">
      <SakinahLogo size={size} className="shrink-0 text-foreground" />
      {!compact && (
        <span className="min-w-0 leading-none">
          <span className="block font-quran text-lg leading-none">سكينة</span>
          <span className="block truncate text-[10px] text-muted-foreground mt-0.5">لحظة هدوء في يومك</span>
        </span>
      )}
    </Link>
  );
}

function AppShellInner({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [moreOpen, setMoreOpen] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  useKeyboardShortcuts();

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));
  const isAiChat = pathname.startsWith("/ai-chat");

  // Lock body scroll while the drawer is open; focus the close button.
  useEffect(() => {
    if (moreOpen) {
      document.body.style.overflow = "hidden";
      closeBtnRef.current?.focus();
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [moreOpen]);

  // Close drawer on route change.
  useEffect(() => { setMoreOpen(false); }, [pathname]);

  return (
    <AudioPlayerProvider>
      <div className="relative min-h-dvh bg-background text-foreground">
        {/* Ambient wash — painted once, own GPU layer, never repaints on scroll */}
        <div
          aria-hidden
          className="ambient-bg"
          style={{
            background: `radial-gradient(ellipse 70% 40% at 50% -8%, color-mix(in oklab, var(--primary-glow) 10%, transparent), transparent 70%)`,
          }}
        />

        <div className="lg:flex lg:min-h-dvh">
          {/* ══ DESKTOP SIDEBAR ══ */}
          <aside className="fixed-chrome hidden lg:flex lg:flex-col lg:w-[264px] shrink-0 sticky top-0 h-dvh border-e border-border bg-surface z-40">
            <div className="px-5 pt-6 pb-5">
              <Brand size={40} />
            </div>

            <Link
              to="/search"
              className="mx-4 mb-5 flex items-center gap-2.5 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-right">دور على أي حاجة</span>
              <span className="kbd">⌘K</span>
            </Link>

            <nav className="flex-1 overflow-y-auto scroll-area px-3 space-y-5 pb-4">
              <div className="space-y-0.5">
                {TABS.map((t) => (
                  <SideNavItem key={t.to} to={t.to} icon={t.icon} label={t.label} active={isActive(t.to)} />
                ))}
              </div>

              {MORE_SECTIONS.map((section) => (
                <div key={section.title} className="space-y-0.5">
                  <p className="px-3 mb-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">{section.title}</p>
                  {section.items.map((it) => (
                    <SideNavItem key={it.to} to={it.to} icon={it.icon} label={it.label} active={isActive(it.to)} />
                  ))}
                </div>
              ))}
            </nav>

            <div className="px-3 pb-5 pt-3 border-t border-border">
              <ProfilePill />
            </div>
          </aside>

          {/* ══ MAIN CONTENT ══ */}
          <main className="flex-1 min-w-0 lg:overflow-y-auto lg:h-dvh scroll-area">
            {!isAiChat && (
              <div className="mobile-shell-bar fixed-chrome lg:hidden">
                <Brand size={34} />
                <div className="flex items-center gap-2">
                  <Link to="/search" className="mobile-menu-trigger" aria-label="دور على أي حاجة">
                    <Search className="h-5 w-5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setMoreOpen(true)}
                    className="mobile-menu-trigger"
                    aria-label="افتح المزيد"
                    aria-expanded={moreOpen}
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
            <div className={`mobile-shell-content mx-auto w-full ${isAiChat ? "max-w-none h-dvh pb-0" : "max-w-2xl pb-32 lg:pb-10"}`}>
              {children}
            </div>
          </main>
        </div>

        {/* ── Global MiniPlayer ── */}
        <MiniPlayer />
        <DesignStudio />

        {isAiChat && (
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="mobile-menu-trigger fixed-chrome lg:hidden fixed start-3 top-[max(env(safe-area-inset-top),0.75rem)] z-50"
            aria-label="افتح المزيد"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* ══ "المزيد" DRAWER — solid scrim, transform-only GPU slide, no blur ══ */}
        <div
          className="drawer-scrim lg:hidden"
          data-open={moreOpen}
          onClick={() => setMoreOpen(false)}
          aria-hidden={!moreOpen}
        />
        <div
          className="drawer-panel lg:hidden gpu-layer flex flex-col"
          data-open={moreOpen}
          role="dialog"
          aria-modal="true"
          aria-label="المزيد"
          inert={!moreOpen ? true : undefined}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-4 pt-[max(env(safe-area-inset-top),1rem)]">
            <Brand size={32} />
            <button
              ref={closeBtnRef}
              type="button"
              onClick={() => setMoreOpen(false)}
              className="grid h-10 w-10 place-items-center rounded-xl bg-card border border-border"
              aria-label="قفل المزيد"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scroll-area px-4 py-4 space-y-6">
            <div className="grid grid-cols-4 gap-2">
              {TABS.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to as any}
                  onClick={() => setMoreOpen(false)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center ${
                    isActive(to) ? "bg-primary text-primary-foreground border-transparent" : "bg-card text-foreground border-border"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[10px] font-semibold leading-tight">{label}</span>
                </Link>
              ))}
            </div>

            {MORE_SECTIONS.map((section) => (
              <div key={section.title}>
                <p className="mb-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">{section.title}</p>
                <div className="space-y-1">
                  {section.items.map(({ to, icon: Icon, label }) => (
                    <Link
                      key={to}
                      to={to as any}
                      onClick={() => setMoreOpen(false)}
                      className={`flex items-center gap-3 rounded-xl border p-3 ${
                        isActive(to) ? "bg-primary text-primary-foreground border-transparent font-semibold" : "bg-card text-foreground border-border"
                      }`}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-sm">{label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            <div className="pt-1">
              <ProfilePill />
            </div>
          </div>
        </div>

        {/* ══ MOBILE BOTTOM TAB BAR ══ */}
        {!isAiChat && (
          <nav
            aria-label="التنقل الأساسي"
            className="fixed-chrome lg:hidden fixed inset-x-0 bottom-0 z-50 px-2 pb-[max(env(safe-area-inset-bottom),6px)] pt-1"
          >
            <div className="mobile-bottom-nav-panel flex items-center justify-between">
              {TABS.map(({ to, icon: Icon, label, badge }) => {
                const active = isActive(to);
                const isCenter = to === "/ai-chat";
                return (
                  <Link
                    key={to}
                    to={to}
                    className="group relative flex min-w-0 flex-1 flex-col items-center gap-1 touch-manipulation"
                    aria-current={active ? "page" : undefined}
                  >
                    <span
                      className={`relative grid place-items-center rounded-full transition-colors duration-150 ${
                        isCenter
                          ? `h-11 w-11 ${active ? "bg-primary text-primary-foreground" : "bg-accent text-foreground"}`
                          : `h-9 w-9 ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`
                      }`}
                    >
                      <Icon className={isCenter ? "h-5 w-5" : "h-[18px] w-[18px]"} strokeWidth={active ? 2.4 : 1.8} />
                      {badge && <span className="absolute -top-0.5 -end-0.5 h-2 w-2 rounded-full bg-primary border-2 border-surface" />}
                    </span>
                    <span className={`max-w-full truncate text-[9.5px] leading-none font-medium ${active ? "text-foreground font-bold" : "text-muted-foreground/70"}`}>
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </AudioPlayerProvider>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AppShellInner>{children}</AppShellInner>
    </AuthProvider>
  );
}
