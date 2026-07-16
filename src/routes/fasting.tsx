import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Moon, Trophy, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { fetchHijriToday, type HijriDate } from "@/lib/islamic";
import { incrementStat } from "@/lib/cloud-sync";

export const Route = createFileRoute("/fasting")({
  head: () => ({
    meta: [
      { title: "صيام رمضان — سكينة" },
      { name: "description", content: "تتبّع صيامك في شهر رمضان المبارك." },
    ],
  }),
  component: FastingPage,
});

const KEY = "sakeenah:ramadan-fasting";

function FastingPage() {
  const [hijri, setHijri] = useState<(HijriDate & { gregorian: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [fasted, setFasted] = useState<Record<string, boolean>>({});
  const [suhoor, setSuhoor] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchHijriToday().then(setHijri).catch(() => {}).finally(() => setLoading(false));
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        setFasted(d.fasted ?? {});
        setSuhoor(d.suhoor ?? {});
      }
    } catch {}
  }, []);

  function persist(f: typeof fasted, s: typeof suhoor) {
    try { localStorage.setItem(KEY, JSON.stringify({ fasted: f, suhoor: s })); } catch {}
  }

  const isRamadan = hijri?.month?.number === 9;
  const currentHijriYear = hijri?.year ?? "";
  const ramadanDays = 30;
  const days = Array.from({ length: ramadanDays }, (_, i) => i + 1);
  const fastedCount = Object.values(fasted).filter(Boolean).length;
  const suhoorCount = Object.values(suhoor).filter(Boolean).length;
  const todayNum = isRamadan ? parseInt(hijri!.day, 10) : 0;

  function toggleDay(day: number) {
    const key = `r${currentHijriYear}-${day}`;
    const was = !!fasted[key];
    const next = { ...fasted, [key]: !was };
    setFasted(next); persist(next, suhoor);
    if (!was) {
      navigator.vibrate?.(18);
      incrementStat("fasting_days", 1);
    } else {
      incrementStat("fasting_days", -1);
    }
    if (fastedCount + (was ? -1 : 1) === ramadanDays) {
      toast.success("🎉 أتممت صيام الشهر كاملاً! تقبّل الله صيامك", { duration: 5000 });
    }
  }

  function toggleSuhoor(day: number) {
    const key = `s${currentHijriYear}-${day}`;
    const next = { ...suhoor, [key]: !suhoor[key] };
    setSuhoor(next); persist(fasted, next);
  }

  if (loading) {
    return <div className="min-h-[50dvh] grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  // Not Ramadan → show info card
  if (!isRamadan) {
    const monthName = hijri?.month?.ar ?? "";
    return (
      <div className="fade-up pb-8 px-4 pt-6">
        <div className="rounded-3xl gradient-hero text-primary-foreground p-6 shadow-elevated relative overflow-hidden mb-4">
          <div aria-hidden className="hidden" />
          <Moon className="h-10 w-10 mb-3 opacity-90" />
          <h1 className="font-quran heading-page">صيام رمضان</h1>
          <p className="text-sm opacity-80 mt-1">التتبّع متاح فقط خلال شهر رمضان المبارك</p>
        </div>

        <div className="rounded-3xl bg-card border border-border/60 p-6 text-center shadow-soft">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto mb-3">
            <Calendar className="h-8 w-8" />
          </div>
          <p className="text-sm text-muted-foreground">التاريخ الهجري اليوم</p>
          <p className="font-quran text-2xl mt-1">{hijri?.day} {monthName} {hijri?.year}</p>
          <p className="text-xs text-muted-foreground mt-3">
            صفحة تتبّع الصيام تفتح تلقائياً عند دخول شهر رمضان.
          </p>
        </div>

        <div className="mt-4 rounded-2xl bg-gold/10 border border-gold/20 p-4">
          <p className="font-quran text-base leading-loose text-center">
            «الصِّيَامُ جُنَّةٌ» — رواه البخاري ومسلم
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-up pb-8">
      <div className="relative overflow-hidden rounded-b-[2.5rem] gradient-hero text-primary-foreground pattern-islamic px-5 pt-8 pb-6 shadow-elevated mb-4">
        <h1 className="font-quran heading-page">رمضان {currentHijriYear}</h1>
        <p className="text-sm opacity-80 mt-1">تقبّل الله منّا ومنكم</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            { label: "أيام صُمتها", value: fastedCount },
            { label: "متبقية", value: ramadanDays - fastedCount },
            { label: "مع السحور", value: suhoorCount },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl bg-white/10 py-2.5">
              <p className="font-quran text-2xl">{value}</p>
              <p className="text-[10px] opacity-75">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4">
        <div className="h-2 rounded-full bg-muted mb-4 overflow-hidden">
          <div className="h-full gradient-gold transition-all duration-500"
            style={{ width: `${(fastedCount / ramadanDays) * 100}%` }} />
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
          {days.map(day => {
            const fKey = `r${currentHijriYear}-${day}`;
            const sKey = `s${currentHijriYear}-${day}`;
            const done = !!fasted[fKey];
            const hasSuhoor = !!suhoor[sKey];
            const isToday = day === todayNum;
            return (
              <div key={day} className={`rounded-2xl overflow-hidden border transition ${
                done ? "border-primary/30" : isToday ? "border-2 border-primary" : "border-border/40"
              }`}>
                <button onClick={() => toggleDay(day)}
                  className={`w-full py-2.5 text-center transition active:scale-90 ${
                    done ? "gradient-primary text-primary-foreground" : "bg-card"
                  }`}>
                  <span className="font-quran text-base font-bold">{day}</span>
                  {done && <div className="text-[8px] mt-0.5 opacity-80">✓</div>}
                </button>
                <button onClick={() => toggleSuhoor(day)} title="سحور"
                  className={`w-full py-1 text-center text-[10px] transition border-t ${
                    hasSuhoor ? "bg-gold/20 text-gold border-gold/20" : "bg-muted/30 text-muted-foreground border-border/30"
                  }`}>
                  {hasSuhoor ? "🌙" : "—"}
                </button>
              </div>
            );
          })}
        </div>

        {fastedCount === ramadanDays && (
          <div className="mt-4 rounded-3xl gradient-gold text-gold-foreground p-5 text-center shadow-gold">
            <Trophy className="h-10 w-10 mx-auto mb-2" />
            <p className="font-quran text-2xl">تقبّل الله صيامك!</p>
            <p className="text-sm opacity-80 mt-1">اللهم تقبّل منا صيامنا وقيامنا</p>
          </div>
        )}
      </div>
    </div>
  );
}
