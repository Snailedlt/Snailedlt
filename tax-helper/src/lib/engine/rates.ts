/**
 * Norwegian tax parameters for shares owned by private individuals.
 *
 * shieldRate: skjermingsrente after tax, set by Skattedirektoratet in January after the income year.
 * upwardFactor: oppjusteringsfaktor applied to gains, losses and dividends above the shield.
 *
 * Sources (checked Nov 2026): Skatteetaten via DNB and Nordnet tables.
 * Verify against skatteetaten.no before relying on a year.
 */
export interface YearParams {
  shieldRate: number | null;
  upwardFactor: number | null;
}

export const CAPITAL_TAX_RATE = 0.22;

export const YEAR_PARAMS: Record<number, YearParams> = {
  2019: { shieldRate: 0.013, upwardFactor: null },
  2020: { shieldRate: 0.006, upwardFactor: null },
  2021: { shieldRate: 0.005, upwardFactor: null },
  2022: { shieldRate: 0.017, upwardFactor: null },
  2023: { shieldRate: 0.032, upwardFactor: 1.72 },
  2024: { shieldRate: 0.039, upwardFactor: 1.72 },
  2025: { shieldRate: 0.036, upwardFactor: 1.72 },
};

/** Tax years the report can be produced for (needs a known upward factor). */
export const SUPPORTED_TAX_YEARS = Object.entries(YEAR_PARAMS)
  .filter(([, p]) => p.upwardFactor !== null)
  .map(([y]) => Number(y))
  .sort((a, b) => b - a);

export function shieldRateFor(year: number, overrides: Record<number, number> = {}): number | null {
  if (year in overrides) return overrides[year];
  return YEAR_PARAMS[year]?.shieldRate ?? null;
}
