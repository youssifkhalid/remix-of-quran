// Default: Makkah — used until the browser resolves the real location.
export const DEFAULT_COORDS = { lat: 21.4225, lng: 39.8262, city: "مكة المكرمة" };

export function useGeolocation() {
  return new Promise<{ lat: number; lng: number } | null>((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 * 30 },
    );
  });
}
