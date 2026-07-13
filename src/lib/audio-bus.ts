export const SAKEENAH_AUDIO_EVENT = "sakeenah:audio-activate";

export type AudioSource = "quran" | "radio";

export function announceAudioSource(source: AudioSource) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SAKEENAH_AUDIO_EVENT, { detail: { source } }));
}

export function onOtherAudioSource(source: AudioSource, pause: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => {
    const activeSource = (event as CustomEvent<{ source?: AudioSource }>).detail?.source;
    if (activeSource && activeSource !== source) pause();
  };
  window.addEventListener(SAKEENAH_AUDIO_EVENT, handler);
  return () => window.removeEventListener(SAKEENAH_AUDIO_EVENT, handler);
}