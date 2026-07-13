/**
 * Cloud-first storage helpers.
 * When user is signed in: reads/writes go to Supabase.
 * When guest: fall back to localStorage.
 * Also mirrors data locally for offline reads.
 */
import { supabase } from "@/integrations/supabase/client";

const LS_PREFIX = "sakeenah:";

async function getUid(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

/* ============ Generic settings JSONB blob ============ */
export async function loadSettings<T = Record<string, unknown>>(defaults: T): Promise<T> {
  const uid = await getUid();
  if (uid) {
    const { data } = await supabase.from("user_settings").select("data").eq("user_id", uid).maybeSingle();
    if (data?.data) {
      const merged = { ...defaults, ...(data.data as T) };
      try { localStorage.setItem(LS_PREFIX + "settings", JSON.stringify(merged)); } catch {}
      return merged;
    }
  }
  try {
    const raw = localStorage.getItem(LS_PREFIX + "settings");
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch {}
  return defaults;
}

export async function saveSettings(patch: Record<string, unknown>): Promise<void> {
  try {
    const existing = JSON.parse(localStorage.getItem(LS_PREFIX + "settings") ?? "{}");
    const merged = { ...existing, ...patch };
    localStorage.setItem(LS_PREFIX + "settings", JSON.stringify(merged));
  } catch {}
  const uid = await getUid();
  if (!uid) return;
  const { data } = await supabase.from("user_settings").select("data").eq("user_id", uid).maybeSingle();
  const merged = { ...((data?.data as object) ?? {}), ...patch };
  await supabase.from("user_settings").upsert({ user_id: uid, data: merged });
}

/* ============ Stats (increment counters) ============ */
export interface UserStats {
  ayat_read: number;
  surahs_completed: number;
  tasbih_count: number;
  adhkar_completed: number;
  fasting_days: number;
  khatmah_days: number;
  streak: number;
  last_active: string | null;
}

export async function loadStats(): Promise<UserStats | null> {
  const uid = await getUid();
  if (!uid) return null;
  const { data } = await supabase
    .from("user_stats").select("*").eq("user_id", uid).maybeSingle();
  return data as UserStats | null;
}

export async function incrementStat(field: keyof UserStats, by = 1): Promise<void> {
  const uid = await getUid();
  if (!uid) return;
  const { data } = await supabase.from("user_stats").select(field).eq("user_id", uid).maybeSingle();
  const current = ((data as any)?.[field] ?? 0) as number;
  await supabase.from("user_stats").upsert({
    user_id: uid,
    [field]: current + by,
    last_active: new Date().toISOString().slice(0, 10),
  } as any);
}

/* ============ Bookmarks ============ */
export interface Bookmark {
  id?: string;
  kind: "ayah" | "surah" | "hadith" | "dua" | "zikr";
  ref: string;
  title?: string;
  note?: string;
  created_at?: string;
}

export async function listBookmarks(): Promise<Bookmark[]> {
  const uid = await getUid();
  if (uid) {
    const { data } = await supabase.from("bookmarks").select("*")
      .eq("user_id", uid).order("created_at", { ascending: false });
    return (data ?? []) as Bookmark[];
  }
  try {
    const raw = localStorage.getItem(LS_PREFIX + "bookmarks");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function addBookmark(b: Bookmark): Promise<void> {
  const uid = await getUid();
  if (uid) {
    await supabase.from("bookmarks").upsert({ ...b, user_id: uid });
    return;
  }
  const list = await listBookmarks();
  const exists = list.some(x => x.kind === b.kind && x.ref === b.ref);
  if (!exists) {
    list.unshift({ ...b, created_at: new Date().toISOString() });
    try { localStorage.setItem(LS_PREFIX + "bookmarks", JSON.stringify(list)); } catch {}
  }
}

export async function removeBookmark(kind: string, ref: string): Promise<void> {
  const uid = await getUid();
  if (uid) {
    await supabase.from("bookmarks").delete().eq("user_id", uid).eq("kind", kind).eq("ref", ref);
    return;
  }
  const list = (await listBookmarks()).filter(x => !(x.kind === kind && x.ref === ref));
  try { localStorage.setItem(LS_PREFIX + "bookmarks", JSON.stringify(list)); } catch {}
}
