import Papa from 'papaparse';
import type { Transaction } from '../types';

export interface ParseResult {
  broker: string;
  transactions: Transaction[];
  warnings: string[];
}

export interface Parser {
  broker: string;
  /** True when the text looks like this broker's export. */
  detect(text: string): boolean;
  parse(text: string): ParseResult;
}

export function rows(text: string): string[][] {
  const res = Papa.parse<string[]>(text.replace(/^﻿/, ''), { skipEmptyLines: true });
  return res.data.map((r) => r.map((c) => (c ?? '').trim()));
}

/** Parses "1,234.56", "1.234,56", "1234,56" and "-12" into numbers. Empty → 0. */
export function num(value: string | undefined): number {
  if (!value) return 0;
  let v = value.replace(/[\s ']/g, '');
  const lastComma = v.lastIndexOf(',');
  const lastDot = v.lastIndexOf('.');
  if (lastComma > lastDot) v = v.replace(/\./g, '').replace(',', '.');
  else v = v.replace(/,/g, '');
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Accepts YYYY-MM-DD, YYYYMMDD, DD-MM-YYYY, DD.MM.YYYY and DD/MM/YYYY (with optional time). */
export function isoDate(value: string): string {
  const v = value.trim();
  let m = v.match(/^(\d{4})-?(\d{2})-?(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = v.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  throw new Error(`Unrecognized date: "${value}"`);
}

/** Fills in missing ISINs from other rows with the same symbol, then sets securityId. */
export function finalize(txs: Transaction[]): Transaction[] {
  const isinBySymbol = new Map<string, string>();
  const nameByKey = new Map<string, string>();
  for (const t of txs) if (t.symbol && t.isin) isinBySymbol.set(t.symbol, t.isin);
  for (const t of txs) {
    if (!t.isin && t.symbol) t.isin = isinBySymbol.get(t.symbol);
    t.securityId = t.isin || t.symbol || t.name || 'UNKNOWN';
    if (t.name && !nameByKey.has(t.securityId)) nameByKey.set(t.securityId, t.name);
  }
  for (const t of txs) t.name = nameByKey.get(t.securityId) ?? t.name;
  return txs;
}

export const ISIN_RE = /\b([A-Z]{2}[A-Z0-9]{9}\d)\b/;
