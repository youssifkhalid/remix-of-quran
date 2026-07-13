import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  User as UserIcon, LogOut, BookOpen, Star, Moon,
  Trophy, Flame, Calendar, Settings, Loader2, Edit3, Check,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { loadStats, type UserStats } from "@/lib/cloud-sync";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "الملف الشخصي — سكينة" },
      { name: "description", content: "بروفايلك وإحصائيات قراءتك وعباداتك." },
    ],
  }),
  component: ProfilePage,
});

interface Profile { id: string; display_name: string | null; avatar_url: string | null; }

function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!authLoading && !user) nav({ to: "/auth" });
  }, [user, authLoading, nav]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, s] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        loadStats(),
      ]);
      if (p) { setProfile(p as Profile); setName((p as Profile).display_name ?? ""); }
      setStats(s);
      setLoading(false);
    })();
  }, [user]);

  async function saveName() {
    if (!user) return;
    await supabase.from("profiles").update({ display_name: name }).eq("id", user.id);
    setProfile(p => p ? { ...p, display_name: name } : p);
    setEditing(false);
    toast.success("تم الحفظ");
  }

  async function handleSignOut() {
    await signOut();
    toast.success("تم تسجيل الخروج");
    nav({ to: "/" });
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-[60dvh] grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const email = user?.email ?? "";
  const initial = (profile?.display_name ?? email)[0]?.toUpperCase() ?? "؟";

  const statCards = [
    { icon: BookOpen, label: "آيات مقروءة", value: stats?.ayat_read ?? 0, color: "from-emerald-500 to-teal-500" },
    { icon: Trophy,   label: "سور مكتملة", value: stats?.surahs_completed ?? 0, color: "from-amber-500 to-yellow-500" },
    { icon: Star,     label: "تسبيحات", value: stats?.tasbih_count ?? 0, color: "from-purple-500 to-pink-500" },
    { icon: Flame,    label: "أذكار", value: stats?.adhkar_completed ?? 0, color: "from-orange-500 to-red-500" },
    { icon: Moon,     label: "أيام صيام", value: stats?.fasting_days ?? 0, color: "from-blue-500 to-indigo-500" },
    { icon: Calendar, label: "أيام متتالية", value: stats?.streak ?? 0, color: "from-rose-500 to-pink-500" },
  ];

  return (
    <div className="px-4 py-4 pb-32 fade-up space-y-4">
      {/* Hero */}
      <div className="rounded-3xl gradient-primary text-primary-foreground p-6 shadow-elevated relative overflow-hidden">
        <div aria-hidden className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="relative">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-20 w-20 rounded-3xl object-cover ring-4 ring-white/30" />
            ) : (
              <div className="h-20 w-20 rounded-3xl bg-white/20 grid place-items-center ring-4 ring-white/30 font-quran text-4xl">
                {initial}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex gap-2">
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  className="flex-1 rounded-xl bg-white/20 text-primary-foreground placeholder:text-primary-foreground/60 px-3 py-2 text-sm outline-none"
                  placeholder="اسمك"
                />
                <button onClick={saveName} className="grid h-9 w-9 place-items-center rounded-xl bg-white/25 hover:bg-white/35">
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="font-quran text-2xl truncate">{profile?.display_name ?? "بلا اسم"}</h1>
                <button onClick={() => setEditing(true)} className="opacity-70 hover:opacity-100">
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>
            )}
            <p className="text-xs opacity-80 mt-1 truncate">{email}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <section>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">إحصائياتي</h2>
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((s) => (
            <div key={s.label} className="rounded-2xl bg-card border border-border/60 p-4 shadow-soft">
              <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${s.color} text-primary-foreground shadow-md mb-2`}>
                <s.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-foreground count-tick" key={s.value}>{s.value.toLocaleString("ar-EG")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <section className="rounded-3xl bg-card border border-border/60 shadow-soft divide-y divide-border/40">
        <Link to="/settings" className="flex items-center gap-3 p-4 hover:bg-muted/30 transition">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Settings className="h-5 w-5" />
          </div>
          <span className="flex-1 font-semibold text-sm">الإعدادات</span>
        </Link>
        <Link to="/bookmarks" className="flex items-center gap-3 p-4 hover:bg-muted/30 transition">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold/10 text-gold">
            <Star className="h-5 w-5" />
          </div>
          <span className="flex-1 font-semibold text-sm">إشاراتي المرجعية</span>
        </Link>
        <button onClick={handleSignOut} className="w-full flex items-center gap-3 p-4 hover:bg-destructive/10 transition text-right">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-destructive/10 text-destructive">
            <LogOut className="h-5 w-5" />
          </div>
          <span className="flex-1 font-semibold text-sm text-destructive">تسجيل الخروج</span>
        </button>
      </section>

      <p className="text-center text-[10px] text-muted-foreground pt-2">
        بياناتك مزامنة تلقائياً على السحابة
      </p>
    </div>
  );
}
