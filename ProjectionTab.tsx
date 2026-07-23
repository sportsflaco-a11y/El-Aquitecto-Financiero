/**
 * Shared clarifying hint for any annual interest/rate input across the app.
 * Used in El Escáner (debt interest rate) and Tu Proyección (CDT rate) so
 * both screens explain "annual rate" with the same concrete example instead
 * of two different, confusing wordings.
 */
export default function RateHint() {
  return (
    <span className="normal-case font-medium text-[9px] text-gray-500 dark:text-[#728276]">
      Si tu tarjeta cobra 2% mensual, tu tasa anual es 24%
    </span>
  );
}
