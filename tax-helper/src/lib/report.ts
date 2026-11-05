import type { TaxReport } from './engine/calculate';

const nok = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 });
/** Whole kroner, the way the tax return wants them. */
export const kr = (n: number) => nok.format(Math.round(n));

/** CSV of the per-security figures, for your own records or an accountant. */
export function reportCsv(r: TaxReport): string {
  const head = [
    'Name', 'ISIN', 'Symbol', 'Gain NOK', 'Loss NOK', 'Shield used on gains NOK', 'Dividends NOK',
    'Shield used on dividends NOK', 'Taxable dividends NOK', 'Foreign tax withheld NOK',
    'Shares at year end', 'Cost at year end NOK', 'Unused shield at year end NOK',
  ];
  const lines = r.securities.map((s) =>
    [
      s.name, s.isin ?? '', s.symbol ?? '', s.gainsNok, s.lossesNok, s.shieldUsedOnGainsNok, s.dividendsNok,
      s.shieldUsedOnDividendsNok, s.taxableDividendsNok, s.withholdingNok, s.sharesAtYearEnd, s.costAtYearEndNok,
      s.unusedShieldAtYearEndNok,
    ]
      .map((v) => (typeof v === 'string' && /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : String(v)))
      .join(','),
  );
  return [head.join(','), ...lines].join('\n');
}

export function countryFromIsin(isin?: string): string {
  if (!isin) return '';
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(isin.slice(0, 2)) ?? isin.slice(0, 2);
  } catch {
    return isin.slice(0, 2);
  }
}
