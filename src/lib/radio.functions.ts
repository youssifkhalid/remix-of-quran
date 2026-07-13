import { createServerFn } from "@tanstack/react-start";

export interface RadioStation {
  id: number;
  name: string;
  url: string;
  recitation?: string;
}

/**
 * Fetches the live Quran radio directory from mp3quran.net — a
 * public, well-maintained catalogue with ~130 live stations, one per
 * reciter/recitation. If the upstream is unavailable we fall back to
 * a small handpicked list so the page never breaks.
 */
export const fetchRadioStations = createServerFn({ method: "GET" }).handler(
  async (): Promise<RadioStation[]> => {
    try {
      const res = await fetch(
        "https://mp3quran.net/api/v3/radios?language=ar",
        { headers: { Accept: "application/json" } },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = (await res.json()) as {
        radios?: Array<{ id: number; name: string; url: string; recitation?: string }>;
      };
      const list = (payload.radios ?? [])
        .filter((r) => r?.url && r?.name)
        .map((r) => ({
          id: Number(r.id),
          name: String(r.name),
          url: String(r.url),
          recitation: r.recitation ? String(r.recitation) : undefined,
        }));
      if (list.length > 0) return list;
    } catch (e) {
      console.error("[radio] mp3quran fetch failed", e);
    }

    // Fallback — a few reliable stations
    return [
      { id: 1, name: "إذاعة القرآن الكريم من مكة المكرمة", url: "https://Qurani.ByplussPlus.com/Quran" },
      { id: 2, name: "إذاعة الشيخ مشاري راشد العفاسي", url: "https://mp3quran.net/api/radio/radio_ar_afs.php" },
      { id: 3, name: "إذاعة الشيخ عبدالرحمن السديس", url: "https://mp3quran.net/api/radio/radio_ar_sds.php" },
    ];
  },
);
