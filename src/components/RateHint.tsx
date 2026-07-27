/**
 * Shared clarifying hint for any annual interest/rate input across the app.
 * Used in El Escáner (any debt type: credit card, auto loan, personal loan,
 * or custom debts users add) and in Tu Proyección (CDT deposit rate), so
 * every screen explains "annual rate" with the same wording. The example is
 * deliberately subject-less (no "tu tarjeta" / "tu deuda") since it needs to
 * make sense for both debts and deposits.
 */
export default function RateHint() {
  return (
    <span className="normal-case font-medium text-[9px] text-gray-500 dark:text-[#728276]">
      Si la tasa mensual es 2%, la tasa anual es 24%
    </span>
  );
}
