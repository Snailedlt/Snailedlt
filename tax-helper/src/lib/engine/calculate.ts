import type { FxLookup, Transaction } from '../types';
import { CAPITAL_TAX_RATE, YEAR_PARAMS, shieldRateFor } from './rates';

/**
 * Norwegian tax rules implemented here (private individuals, shares outside a share savings account):
 * - FIFO: the first shares bought are the first sold (skatteloven § 10-36).
 * - Cost and proceeds are converted to NOK at the rate on each transaction date.
 * - Shielding deduction (skjermingsfradrag): every share owned on 31 December gets
 *   (cost + unused shield from earlier years) × the year's shield rate. It reduces dividends
 *   that year first; what's left carries forward and can reduce a later gain on that share.
 *   It can never create or increase a loss, and it lapses when the share is sold at a loss.
 * - Gains, losses and dividends above the shield are multiplied by the upward factor and taxed at 22%.
 */

export interface SaleLine {
  date: string;
  quantity: number;
  proceedsNok: number;
  costNok: number;
  /** Gain (positive) or loss (negative) before shielding. */
  resultNok: number;
  shieldUsedNok: number;
  /** Result after shielding; this is what goes on the tax return. */
  taxableResultNok: number;
}

export interface SecurityReport {
  securityId: string;
  name: string;
  isin?: string;
  symbol?: string;
  currency: string;
  sales: SaleLine[];
  gainsNok: number;
  lossesNok: number;
  shieldUsedOnGainsNok: number;
  dividendsNok: number;
  withholdingNok: number;
  shieldUsedOnDividendsNok: number;
  taxableDividendsNok: number;
  sharesAtYearEnd: number;
  costAtYearEndNok: number;
  shieldGrantedThisYearNok: number;
  unusedShieldAtYearEndNok: number;
}

export interface TaxReport {
  taxYear: number;
  securities: SecurityReport[];
  totals: {
    gainsNok: number;
    lossesNok: number;
    netResultNok: number;
    taxableDividendsNok: number;
    withholdingNok: number;
    /** Rough estimate before any credit for foreign tax. */
    estimatedTaxNok: number;
  };
  warnings: string[];
}

export interface CalculateOptions {
  taxYear: number;
  fx: FxLookup;
  /** Shield rates for years missing from the built-in table, e.g. years before 2019. */
  shieldRateOverrides?: Record<number, number>;
}

interface Lot {
  quantity: number;
  costNok: number;
  unusedShieldNok: number;
}

const TYPE_ORDER: Record<Transaction['type'], number> = { BUY: 0, DIVIDEND: 1, WITHHOLDING: 2, SELL: 3 };
const EPS = 1e-9;
const round = (n: number) => Math.round(n * 100) / 100;
const yearOf = (date: string) => Number(date.slice(0, 4));

function emptyReport(tx: Transaction): SecurityReport {
  return {
    securityId: tx.securityId,
    name: tx.name ?? tx.symbol ?? tx.securityId,
    isin: tx.isin,
    symbol: tx.symbol,
    currency: tx.currency,
    sales: [],
    gainsNok: 0,
    lossesNok: 0,
    shieldUsedOnGainsNok: 0,
    dividendsNok: 0,
    withholdingNok: 0,
    shieldUsedOnDividendsNok: 0,
    taxableDividendsNok: 0,
    sharesAtYearEnd: 0,
    costAtYearEndNok: 0,
    shieldGrantedThisYearNok: 0,
    unusedShieldAtYearEndNok: 0,
  };
}

export function calculate(transactions: Transaction[], opts: CalculateOptions): TaxReport {
  const { taxYear, fx } = opts;
  const params = YEAR_PARAMS[taxYear];
  if (!params?.upwardFactor) throw new Error(`Tax year ${taxYear} is not supported yet.`);

  const warnings: string[] = [];
  const bySecurity = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    if (yearOf(tx.date) > taxYear) continue;
    const list = bySecurity.get(tx.securityId) ?? [];
    list.push(tx);
    bySecurity.set(tx.securityId, list);
  }

  const missingRateYears = new Set<number>();
  const securities: SecurityReport[] = [];

  for (const [id, txs] of bySecurity) {
    txs.sort((a, b) => a.date.localeCompare(b.date) || TYPE_ORDER[a.type] - TYPE_ORDER[b.type]);
    const report = emptyReport(txs.find((t) => t.name) ?? txs[0]);
    const lots: Lot[] = [];
    const firstYear = yearOf(txs[0].date);
    let i = 0;

    for (let year = firstYear; year <= taxYear; year++) {
      let dividendsNok = 0;

      for (; i < txs.length && yearOf(txs[i].date) === year; i++) {
        const tx = txs[i];
        const rate = fx(tx.currency, tx.date);
        if (tx.type === 'BUY') {
          lots.push({ quantity: tx.quantity, costNok: (tx.amount + tx.fees) * rate, unusedShieldNok: 0 });
        } else if (tx.type === 'SELL') {
          const line = sell(lots, tx, rate, id, warnings);
          if (year === taxYear) report.sales.push(line);
        } else if (tx.type === 'DIVIDEND') {
          dividendsNok += tx.amount * rate;
        } else if (tx.type === 'WITHHOLDING' && year === taxYear) {
          report.withholdingNok += tx.amount * rate;
        }
      }

      // 31 December: grant this year's shield to every share still owned.
      const shieldRate = shieldRateFor(year, opts.shieldRateOverrides);
      let granted = 0;
      if (lots.length > 0) {
        if (shieldRate === null) missingRateYears.add(year);
        for (const lot of lots) {
          const shield = (lot.costNok + lot.unusedShieldNok) * (shieldRate ?? 0);
          lot.unusedShieldNok += shield;
          granted += shield;
        }
      }

      // The shield reduces this year's dividends first.
      const totalShield = lots.reduce((s, l) => s + l.unusedShieldNok, 0);
      const usedOnDividends = Math.min(dividendsNok, totalShield);
      if (usedOnDividends > 0) {
        for (const lot of lots) lot.unusedShieldNok -= usedOnDividends * (lot.unusedShieldNok / totalShield);
      }

      if (year === taxYear) {
        report.dividendsNok = dividendsNok;
        report.shieldUsedOnDividendsNok = usedOnDividends;
        report.taxableDividendsNok = dividendsNok - usedOnDividends;
        report.shieldGrantedThisYearNok = granted;
      }
    }

    for (const s of report.sales) {
      if (s.taxableResultNok >= 0) report.gainsNok += s.taxableResultNok;
      else report.lossesNok += s.taxableResultNok;
      report.shieldUsedOnGainsNok += s.shieldUsedNok;
    }
    report.sharesAtYearEnd = lots.reduce((s, l) => s + l.quantity, 0);
    report.costAtYearEndNok = lots.reduce((s, l) => s + l.costNok, 0);
    report.unusedShieldAtYearEndNok = lots.reduce((s, l) => s + l.unusedShieldNok, 0);

    const touchesYear =
      report.sales.length > 0 || report.dividendsNok > 0 || report.withholdingNok > 0 || report.sharesAtYearEnd > EPS;
    if (touchesYear) securities.push(roundReport(report));
  }

  if (missingRateYears.size > 0) {
    const years = [...missingRateYears].sort().join(', ');
    warnings.push(
      `No shield rate is built in for ${years}, so no shielding deduction was counted for those years. ` +
        `Enter the rates from skatteetaten.no to include it.`,
    );
  }

  securities.sort((a, b) => a.name.localeCompare(b.name));
  const sum = (f: (s: SecurityReport) => number) => round(securities.reduce((t, s) => t + f(s), 0));
  const gainsNok = sum((s) => s.gainsNok);
  const lossesNok = sum((s) => s.lossesNok);
  const taxableDividendsNok = sum((s) => s.taxableDividendsNok);
  const netResultNok = round(gainsNok + lossesNok);
  const estimatedTaxNok = round((netResultNok + taxableDividendsNok) * params.upwardFactor * CAPITAL_TAX_RATE);

  return {
    taxYear,
    securities,
    totals: {
      gainsNok,
      lossesNok,
      netResultNok,
      taxableDividendsNok,
      withholdingNok: sum((s) => s.withholdingNok),
      estimatedTaxNok,
    },
    warnings: [...new Set(warnings)],
  };
}

function sell(lots: Lot[], tx: Transaction, rate: number, id: string, warnings: string[]): SaleLine {
  const proceedsNok = (tx.amount - tx.fees) * rate;
  let remaining = tx.quantity;
  let costNok = 0;

  // Shield is applied per lot: a lot's shield can only reduce the gain on that lot.
  let shieldUsedNok = 0;
  let resultNok = 0;
  while (remaining > EPS && lots.length > 0) {
    const lot = lots[0];
    const q = Math.min(remaining, lot.quantity);
    const share = q / lot.quantity;
    const lotCost = lot.costNok * share;
    const lotShield = lot.unusedShieldNok * share;
    const lotProceeds = proceedsNok * (q / tx.quantity);
    const lotResult = lotProceeds - lotCost;
    const used = lotResult > 0 ? Math.min(lotShield, lotResult) : 0;

    costNok += lotCost;
    shieldUsedNok += used;
    resultNok += lotResult;

    lot.quantity -= q;
    lot.costNok -= lotCost;
    lot.unusedShieldNok -= lotShield;
    if (lot.quantity <= EPS) lots.shift();
    remaining -= q;
  }

  if (remaining > EPS) {
    // Sold more than the uploaded history shows as bought: treat the missing shares as costing 0.
    resultNok += proceedsNok * (remaining / tx.quantity);
    warnings.push(
      `${tx.name ?? id}: sold ${round(remaining)} more shares than the files show as bought. ` +
        `Their cost was counted as 0, which overstates the gain. Upload the export that has the original purchase.`,
    );
  }

  return {
    date: tx.date,
    quantity: tx.quantity,
    proceedsNok: round(proceedsNok),
    costNok: round(costNok),
    resultNok: round(resultNok),
    shieldUsedNok: round(shieldUsedNok),
    taxableResultNok: round(resultNok - shieldUsedNok),
  };
}

function roundReport(r: SecurityReport): SecurityReport {
  const out = { ...r };
  for (const key of Object.keys(out) as (keyof SecurityReport)[]) {
    if (typeof out[key] === 'number') (out as Record<string, unknown>)[key] = round(out[key] as number);
  }
  out.sharesAtYearEnd = Math.round(r.sharesAtYearEnd * 1e6) / 1e6;
  return out;
}
