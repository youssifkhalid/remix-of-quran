type SakinahLogoProps = {
  size?: number;
  className?: string;
  /** Render just the mark, or the mark with the wordmark beside it */
  withWordmark?: boolean;
};

/**
 * Minimal, calm mark: a crescent cradling a still point of light above
 * three concentric ripples ("سكينة" — tranquility, stillness of the heart).
 * Uses currentColor + CSS variables so it inherits the app's theme and
 * needs no filters/blur — flat fills only, safe for low-end GPUs.
 */
export function SakinahLogo({ size = 40, className = "", withWordmark = false }: SakinahLogoProps) {
  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="سكينة"
    >
      <defs>
        <linearGradient id="sakinah-g" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--gold, #d4af37)" />
          <stop offset="1" stopColor="var(--primary, #16a570)" />
        </linearGradient>
      </defs>

      {/* still-water ripples */}
      <circle cx="24" cy="34" r="10" stroke="currentColor" strokeOpacity="0.16" strokeWidth="1.4" fill="none" />
      <circle cx="24" cy="34" r="6.5" stroke="currentColor" strokeOpacity="0.24" strokeWidth="1.4" fill="none" />

      {/* crescent */}
      <path
        d="M28.5 8.2c-6.9 1.4-12.1 7.5-12.1 14.8 0 8.3 6.7 15 15 15 3 0 5.8-.9 8.1-2.4-2 .9-4.2 1.4-6.5 1.4-8.6 0-15.6-7-15.6-15.6 0-6 3.4-11.2 8.4-13.8.9-.5 1.8-.9 2.7-1.2z"
        fill="url(#sakinah-g)"
      />

      {/* still point of light cradled by the crescent */}
      <circle cx="24" cy="16" r="2.6" fill="currentColor" />
    </svg>
  );

  if (!withWordmark) return mark;

  return (
    <span className="inline-flex items-center gap-2.5">
      {mark}
      <span className="leading-none">
        <span className="block font-quran text-xl leading-none">سكينة</span>
      </span>
    </span>
  );
}
