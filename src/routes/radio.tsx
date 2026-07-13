import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, Pause, Volume2, Radio, Loader2, VolumeX, Search, AlertCircle } from "lucide-react";
import { fetchRadioStations } from "@/lib/radio.functions";

export const Route = createFileRoute("/radio")({
  head: () => ({
    meta: [
      { title: "إذاعة القرآن الكريم — سكينة" },
      { name: "description", content: "استمع لأكثر من 100 إذاعة قرآن كريم مباشرة من مختلف القراء." },
    ],
  }),
  component: RadioPage,
});

// Deterministic color gradient per station id so cards look varied
const GRADIENTS = [
  "from-emerald-600 to-teal-700",
  "from-primary/80 to-primary",
  "from-amber-600 to-orange-700",
  "from-blue-600 to-indigo-700",
  "from-violet-600 to-purple-700",
  "from-rose-600 to-pink-700",
  "from-cyan-600 to-sky-700",
  "from-fuchsia-600 to-pink-700",
  "from-lime-600 to-emerald-700",
  "from-slate-600 to-gray-700",
];

function RadioPage() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);
  const [loading, setLoading] = useState<number | null>(null);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const { data: stations = [], isLoading, isError } = useQuery({
    queryKey: ["radio-stations"],
    queryFn: () => fetchRadioStations(),
    staleTime: 60 * 60 * 1000, // 1h
  });

  const filtered = useMemo(() => {
    const query = q.trim();
    if (!query) return stations;
    return stations.filter((s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      (s.recitation ?? "").toLowerCase().includes(query.toLowerCase()),
    );
  }, [stations, q]);

  function getAudio() {
    if (!audioRef.current) audioRef.current = new Audio();
    return audioRef.current;
  }

  useEffect(() => {
    const audio = getAudio();
    const onPlay = () => {
      const id = Number(audio.dataset.stationId);
      setPlaying(Number.isFinite(id) ? id : null);
      setLoading(null);
    };
    const onPause = () => setPlaying(null);
    const onWaiting = () => {
      const id = Number(audio.dataset.stationId);
      setLoading(Number.isFinite(id) ? id : null);
    };
    const onCanPlay = () => setLoading(null);
    const onErr = () => {
      setError("تعذّر تحميل البث. جرّب إذاعة أخرى.");
      setLoading(null);
      setPlaying(null);
    };
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("error", onErr);
    return () => {
      audio.pause();
      audio.src = "";
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("error", onErr);
    };
  }, []);

  function playStation(st: { id: number; name: string; url: string }) {
    const audio = getAudio();
    setError(null);
    if (playing === st.id) {
      audio.pause();
      setPlaying(null);
      return;
    }
    audio.pause();
    audio.src = st.url;
    audio.dataset.stationId = String(st.id);
    audio.volume = muted ? 0 : volume;
    setLoading(st.id);
    audio.play().catch(() => setError("تعذّر تشغيل البث المباشر."));
  }

  function toggleMute() {
    const audio = getAudio();
    audio.muted = !muted;
    setMuted((m) => !m);
  }

  function changeVolume(v: number) {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  }

  const currentStation = stations.find((s) => s.id === playing);

  return (
    <div className="fade-up pb-32">
      <header className="px-5 pt-6 pb-3">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-primary" />
          <h1 className="font-quran text-3xl">إذاعة القرآن الكريم</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {stations.length > 0
            ? `${stations.length.toLocaleString("ar")} إذاعة مباشرة من مختلف القراء`
            : "استمع للقرآن الكريم على مدار الساعة"}
        </p>

        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-card border border-border px-4 py-3 shadow-soft">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث عن قارئ أو إذاعة…"
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      </header>

      {error && (
        <div className="mx-5 mb-3 flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <p className="text-sm">جارٍ تحميل الإذاعات…</p>
        </div>
      )}

      {isError && !isLoading && (
        <div className="mx-5 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">تعذّر تحميل قائمة الإذاعات، تأكد من اتصالك بالإنترنت.</p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <ul className="px-5 space-y-2.5">
          {filtered.map((st) => {
            const active = playing === st.id;
            const isBuffering = loading === st.id;
            const grad = GRADIENTS[st.id % GRADIENTS.length];
            return (
              <li key={st.id}>
                <button
                  onClick={() => playStation(st)}
                  className={`w-full flex items-center gap-3 rounded-2xl border p-3 text-right transition active:scale-[0.98] ${
                    active
                      ? "border-primary/40 bg-primary/5 shadow-elevated"
                      : "border-border/60 bg-card hover:bg-surface-elevated shadow-soft"
                  }`}
                >
                  <span
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${grad} text-white shadow-md`}
                  >
                    {isBuffering ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : active ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5 translate-x-[1px]" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{st.name}</p>
                    {st.recitation && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {st.recitation}
                      </p>
                    )}
                  </div>
                  {active && (
                    <span className="flex items-center gap-0.5 text-primary">
                      <span className="w-0.5 h-3 bg-current animate-pulse rounded-full" />
                      <span className="w-0.5 h-4 bg-current animate-pulse rounded-full" style={{ animationDelay: "150ms" }} />
                      <span className="w-0.5 h-2 bg-current animate-pulse rounded-full" style={{ animationDelay: "300ms" }} />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!isLoading && filtered.length === 0 && stations.length > 0 && (
        <p className="px-5 text-center text-sm text-muted-foreground py-10">
          لا توجد نتائج تطابق البحث
        </p>
      )}

      {/* Bottom control bar */}
      {currentStation && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-30 mx-auto max-w-3xl px-3 pb-3">
          <div className="rounded-2xl bg-card/95 backdrop-blur border border-border shadow-elevated p-3 flex items-center gap-3">
            <button
              onClick={toggleMute}
              className="grid h-9 w-9 place-items-center rounded-full bg-muted/50 hover:bg-muted transition"
              aria-label={muted ? "إلغاء الكتم" : "كتم"}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => changeVolume(Number(e.target.value))}
              className="flex-1 accent-primary"
              aria-label="مستوى الصوت"
            />
            <div className="min-w-0 flex-1 text-left">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">يبث الآن</p>
              <p className="text-xs font-bold truncate">{currentStation.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
