import Papa from 'papaparse';
import type { FxLookup } from '../types';

/** How many days back we look for a rate (covers weekends and Easter). */
const MAX_GAP_DAYS = 10;

export class MissingRateError extends Error {
  constructor(
    public currency: string,
    public date: string,
  ) {
    super(`No ${currency}/NOK exchange rate found for ${date}.`);
  }
}

/** Daily NOK exchange rates per currency, from Norges Bank. */
export class RateTable {
  private series = new Map<string, { dates: string[]; values: number[] }>();

  add(currency: string, date: string, nokPerUnit: number) {
    const s = this.series.get(currency) ?? { dates: [], values: [] };
    s.dates.push(date);
    s.values.push(nokPerUnit);
    this.series.set(currency, s);
  }

  /** Must be called after adding rates, before lookups. */
  sort() {
    for (const s of this.series.values()) {
      const order = s.dates.map((_, i) => i).sort((a, b) => s.dates[a].localeCompare(s.dates[b]));
      s.dates = order.map((i) => s.dates[i]);
      s.values = order.map((i) => s.values[i]);
    }
    return this;
  }

  currencies() {
    return [...this.series.keys()];
  }

  has(currency: string) {
    return currency === 'NOK' || this.series.has(currency);
  }

  /** Rate on `date`, or the last published rate before it (weekends and holidays). */
  lookup: FxLookup = (currency, date) => {
    if (currency === 'NOK') return 1;
    const s = this.series.get(currency);
    if (!s) throw new MissingRateError(currency, date);
    let lo = 0;
    let hi = s.dates.length - 1;
    let found = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (s.dates[mid] <= date) {
        found = mid;
        lo = mid + 1;
      } else hi = mid - 1;
    }
    if (found < 0) throw new MissingRateError(currency, date);
    const gap = (Date.parse(date) - Date.parse(s.dates[found])) / 86_400_000;
    if (gap > MAX_GAP_DAYS) throw new MissingRateError(currency, date);
    return s.values[found];
  };

  merge(other: RateTable) {
    for (const [cur, s] of other.series) s.dates.forEach((d, i) => this.add(cur, d, s.values[i]));
    return this.sort();
  }
}

/**
 * Reads Norges Bank's CSV (SDMX) format, from the API or downloaded from norges-bank.no.
 * Rates for currencies like SEK and JPY are quoted per 100 units (UNIT_MULT = 2).
 */
export function parseNorgesBankCsv(text: string, table = new RateTable()): RateTable {
  const res = Papa.parse<Record<string, string>>(text.replace(/^﻿/, ''), { header: true, skipEmptyLines: true });
  const fields = res.meta.fields ?? [];
  if (!fields.includes('OBS_VALUE') || !fields.includes('TIME_PERIOD')) {
    throw new Error("This doesn't look like a Norges Bank exchange rate file (missing TIME_PERIOD or OBS_VALUE).");
  }
  for (const r of res.data) {
    const value = Number((r.OBS_VALUE ?? '').replace(',', '.'));
    if (!r.BASE_CUR || !Number.isFinite(value) || !r.OBS_VALUE) continue;
    const mult = 10 ** Number(r.UNIT_MULT || 0);
    table.add(r.BASE_CUR.toUpperCase(), r.TIME_PERIOD, value / mult);
  }
  return table.sort();
}

export function norgesBankUrl(currencies: string[], start: string, end: string) {
  return (
    `https://data.norges-bank.no/api/data/EXR/B.${currencies.join('+')}.NOK.SP` +
    `?format=csv&startPeriod=${start}&endPeriod=${end}&locale=en&bom=include`
  );
}

/** Downloads daily rates for the given currencies, starting a little before `start` to cover weekends. */
export async function fetchNorgesBankRates(currencies: string[], start: string, end: string): Promise<RateTable> {
  const from = new Date(Date.parse(start) - MAX_GAP_DAYS * 86_400_000).toISOString().slice(0, 10);
  const res = await fetch(norgesBankUrl(currencies, from, end));
  if (!res.ok) throw new Error(`Norges Bank answered ${res.status}.`);
  return parseNorgesBankCsv(await res.text());
}
