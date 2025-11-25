/**
 * Calculates the usage factor based on operating hours
 * F_usage = (Heures/jour × Jours/semaine × 52) / 8760
 * 
 * @param hoursPerDay - Operating hours per day (1-24)
 * @param daysPerWeek - Operating days per week (1-7)
 * @returns Usage factor between 0 and 1
 */
export function computeUsageFactor(hoursPerDay: number, daysPerWeek: number): number {
  const HOURS_PER_YEAR = 8760;
  const WEEKS_PER_YEAR = 52;

  const annualOperatingHours = hoursPerDay * daysPerWeek * WEEKS_PER_YEAR;
  const usageFactor = annualOperatingHours / HOURS_PER_YEAR;

  return Math.min(Math.max(usageFactor, 0), 1);
}


