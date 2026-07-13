import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Mail, Lock, User as UserIcon, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — سكينة" },
      { name: "description", content: "سجّل الدخول أو أنشئ حساباً لمزامنة قراءاتك وإشاراتك عبر أجهزتك." },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1a6.2 6.2 0 1 1 0-12.4c1.94 0 3.24.83 3.98 1.54l2.72-2.62A9.9 9.9 0 0 0 12 2a10 10 0 1 0 0 20c5.77 0 9.6-4.05 9.6-9.76 0-.66-.07-1.16-.16-1.66H12z"/>
    </svg>
  );
}

function AuthPage() {
  const nav = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !authLoading) nav({ to: "/profile" });
  }, [user, authLoading, nav]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/profile`,
            data: { full_name: name || undefined },
          },
        });
        if (error) throw error;
        toast.success("تم إنشاء الحساب! تحقق من بريدك لتأكيد الحساب.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("مرحباً بعودتك");
        nav({ to: "/profile" });
      }
    } catch (e: any) {
      toast.error(e?.message ?? "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const res = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (res.error) throw res.error;
      if (!res.redirected) {
        toast.success("تم تسجيل الدخول");
        nav({ to: "/profile" });
      }
    } catch (e: any) {
      toast.error(e?.message ?? "تعذّر تسجيل الدخول بجوجل");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] px-4 py-6 flex items-center justify-center">
      <div className="w-full max-w-md fade-up">
        <div className="text-center mb-6">
          <div className="inline-grid h-16 w-16 place-items-center rounded-3xl gradient-primary text-primary-foreground shadow-glow mb-3">
            <span className="font-quran text-3xl leading-none">س</span>
          </div>
          <h1 className="font-quran text-3xl">سكينة</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signin" ? "أهلاً بعودتك" : "أنشئ حسابك وابدأ الرحلة"}
          </p>
        </div>

        <div className="rounded-3xl bg-card border border-border/60 shadow-elevated p-6 space-y-4">
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-2xl bg-background border border-border py-3 text-sm font-semibold hover:bg-muted/40 transition disabled:opacity-50"
          >
            <GoogleIcon />
            المتابعة بجوجل
          </button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            أو بالبريد
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            {mode === "signup" && (
              <label className="block">
                <span className="text-xs text-muted-foreground mb-1 block">الاسم</span>
                <div className="relative">
                  <UserIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="اسمك"
                    className="w-full rounded-2xl bg-background border border-border pr-10 pl-3 py-3 text-sm outline-none focus:border-primary transition"
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="text-xs text-muted-foreground mb-1 block">البريد الإلكتروني</span>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full rounded-2xl bg-background border border-border pr-10 pl-3 py-3 text-sm outline-none focus:border-primary transition"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs text-muted-foreground mb-1 block">كلمة المرور</span>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  required minLength={6} autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  className="w-full rounded-2xl bg-background border border-border pr-10 pl-3 py-3 text-sm outline-none focus:border-primary transition"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl gradient-primary text-primary-foreground py-3 text-sm font-bold shadow-glow disabled:opacity-50 hover:brightness-110 transition"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                  {mode === "signin" ? "تسجيل الدخول" : "إنشاء حساب"}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </>
              )}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition"
          >
            {mode === "signin" ? "ليس لديك حساب؟ أنشئ حساباً" : "لديك حساب؟ سجّل الدخول"}
          </button>
        </div>

        <div className="text-center mt-4">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            المتابعة بدون حساب
          </Link>
        </div>
      </div>
    </div>
  );
}
