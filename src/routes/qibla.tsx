import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Compass as CompassIcon, MapPin, Navigation2, AlertCircle } from "lucide-react";
import { qiblaBearing } from "@/lib/islamic";
import { useGeolocation } from "@/lib/geo";

export const Route = createFileRoute("/qibla")({
  head: () => ({
    meta: [
      { title: "اتجاه القبلة — سكينة" },
      { name: "description", content: "بوصلة قبلة دقيقة تستخدم جيروسكوب جهازك مع حساب المسافة إلى مكة المكرمة." },
    ],
  }),
  component: QiblaPage,
});

const KAABA = { lat: 21.4225, lng: 39.8262 };

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function QiblaPage() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [bearing, setBearing] = useState<number | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [orientError, setOrientError] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [needsIOSPermission, setNeedsIOSPermission] = useState(false);
  const [listening, setListening] = useState(false);

  // Location
  useEffect(() => {
    useGeolocation().then((c) => {
      if (c) {
        setCoords(c);
        setBearing(qiblaBearing(c.lat, c.lng));
        setDistance(haversineKm(c.lat, c.lng, KAABA.lat, KAABA.lng));
      } else {
        setLocError("تعذّر تحديد موقعك. فعّل خدمة الموقع من المتصفح ثم أعد المحاولة.");
      }
    });
  }, []);

  const startCompass = useCallback(() => {
    if (typeof window === "undefined") return;

    const handler = (e: DeviceOrientationEvent & { webkitCompassHeading?: number }) => {
      // iOS Safari provides `webkitCompassHeading` measured clockwise from
      // true north — the ideal value. On Android/Chromium we approximate
      // from `alpha` when `absolute: true` is available.
      let h: number | null = null;
      if (typeof e.webkitCompassHeading === "number") {
        h = e.webkitCompassHeading;
      } else if (typeof e.alpha === "number") {
        // e.absolute === true means alpha is measured against magnetic north.
        h = 360 - e.alpha;
      }
      if (h != null && Number.isFinite(h)) {
        setHeading(((h % 360) + 360) % 360);
      }
    };

    // Prefer the absolute event when available (Chrome/Android)
    const absoluteEvent = "ondeviceorientationabsolute" in window
      ? "deviceorientationabsolute"
      : "deviceorientation";

    window.addEventListener(absoluteEvent, handler as EventListener, true);
    setListening(true);

    return () => {
      window.removeEventListener(absoluteEvent, handler as EventListener, true);
      setListening(false);
    };
  }, []);

  // Detect if iOS 13+ permission is needed
  useEffect(() => {
    if (typeof window === "undefined") return;
    const D = (window as any).DeviceOrientationEvent;
    if (D && typeof D.requestPermission === "function") {
      setNeedsIOSPermission(true);
    } else {
      // Android / desktop — attach directly
      const cleanup = startCompass();
      return cleanup;
    }
  }, [startCompass]);

  async function requestPermission() {
    setOrientError(null);
    const D = (window as any).DeviceOrientationEvent;
    if (D && typeof D.requestPermission === "function") {
      try {
        const state = await D.requestPermission();
        if (state === "granted") {
          setNeedsIOSPermission(false);
          startCompass();
        } else {
          setOrientError("لم يُسمح باستخدام البوصلة. فعّلها من إعدادات Safari > المواقع.");
        }
      } catch {
        setOrientError("تعذّر طلب صلاحية البوصلة.");
      }
    }
  }

  const rotation = bearing != null && heading != null ? bearing - heading : (bearing ?? 0);
  const aligned = heading != null && bearing != null && Math.abs(((rotation + 540) % 360) - 180) < 5;

  return (
    <div className="fade-up min-h-[calc(100dvh-7rem)] flex flex-col">
      <header className="px-5 pt-6">
        <h1 className="font-quran text-3xl">اتجاه القبلة</h1>
        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {coords ? `${coords.lat.toFixed(3)}°, ${coords.lng.toFixed(3)}°` : "—"}
          </span>
          {distance && (
            <span className="flex items-center gap-1 text-primary font-semibold">
              <Navigation2 className="h-3 w-3" />
              {Math.round(distance).toLocaleString("ar")} كم من مكة
            </span>
          )}
        </div>
      </header>

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="relative">
          {aligned && (
            <span className="absolute inset-0 rounded-full gradient-gold opacity-40 pulse-ring" />
          )}
          <div
            className="relative h-72 w-72 rounded-full gradient-card border border-border shadow-elevated flex items-center justify-center"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: "transform 200ms ease-out",
              willChange: "transform",
            }}
          >
            <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
              <g stroke="currentColor" className="text-muted-foreground/40">
                {Array.from({ length: 72 }).map((_, i) => {
                  const long = i % 9 === 0;
                  const a = (i * 5 * Math.PI) / 180;
                  const x1 = 100 + Math.sin(a) * 92;
                  const y1 = 100 - Math.cos(a) * 92;
                  const x2 = 100 + Math.sin(a) * (long ? 82 : 86);
                  const y2 = 100 - Math.cos(a) * (long ? 82 : 86);
                  return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={long ? 1.5 : 0.7} />;
                })}
              </g>
              <text x="100" y="22" textAnchor="middle" className="fill-muted-foreground" fontSize="11">N</text>
            </svg>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="w-0 h-0 border-x-[10px] border-x-transparent border-b-[16px] border-b-gold drop-shadow" />
              <span className="mt-0.5 text-[10px] font-bold text-gold">القبلة</span>
            </div>
            <div className="relative grid h-24 w-24 place-items-center rounded-full gradient-primary text-primary-foreground shadow-glow">
              <CompassIcon className="h-9 w-9" />
            </div>
          </div>
        </div>

        <div className="mt-8 text-center max-w-sm">
          {bearing != null ? (
            <div className="flex items-center justify-center gap-3">
              <p className="text-4xl font-light">{Math.round(bearing)}°</p>
              <span className="text-xs text-muted-foreground leading-tight">من الشمال<br />الحقيقي</span>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">جارٍ تحديد الاتجاه…</p>
          )}
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {heading == null && !needsIOSPermission
              ? "أمسك الجهاز بشكل مسطح وحرّكه على شكل رقم ٨ لمعايرة البوصلة."
              : aligned
                ? "✓ أنت تتجه نحو القبلة — تقبّل الله صلاتك."
                : heading != null
                  ? "وجّه السهم الذهبي نحو الأعلى للوصول إلى القبلة."
                  : "اضغط «تفعيل البوصلة» للسماح باستخدام جيروسكوب الجهاز."}
          </p>

          {needsIOSPermission && (
            <button
              onClick={requestPermission}
              className="mt-4 rounded-full gradient-primary text-primary-foreground px-6 py-2.5 text-sm shadow-elevated active:scale-95 transition"
            >
              تفعيل البوصلة
            </button>
          )}

          {listening && heading == null && !needsIOSPermission && (
            <p className="mt-3 text-[11px] text-muted-foreground/70">
              في انتظار قراءة الجيروسكوب… جرّب هز الجهاز قليلاً.
            </p>
          )}

          {(locError || orientError) && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive text-right">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{orientError ?? locError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
