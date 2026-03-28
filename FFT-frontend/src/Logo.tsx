export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-label="FoodTrace Logo">
      <rect width="40" height="40" rx="10" fill="var(--accent)" />
      {/* Source: farm/origin dot */}
      <circle cx="9" cy="31" r="2.8" fill="white" fillOpacity="0.85" />
      {/* Journey path */}
      <path
        d="M9 31 C12 20 21 15 31 9"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeOpacity="0.65"
      />
      {/* Destination: ping ring + dot */}
      <circle cx="31" cy="9" r="5.5" stroke="white" strokeWidth="1.4" strokeOpacity="0.3" />
      <circle cx="31" cy="9" r="3" fill="white" />
    </svg>
  );
}
