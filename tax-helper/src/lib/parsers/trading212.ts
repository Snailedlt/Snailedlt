import type { Transaction } from '../types';
import { finalize, isoDate, num, rows, type ParseResult, type Parser } from './util';

/**
 * Trading 212 "History" CSV export.
 * Trades use the account-currency "Total", which already includes FX and other fees.
 */
export const trading212Parser: Parser = {
  broker: 'Trading 212',
  detect: (text) => /^﻿?"?Action"?,"?Time"?,/.test(text) && /No\. of shares/.test(text.slice(0, 500)),
  parse(text): ParseResult {
    const [header, ...data] = rows(text);
    const get = (r: string[], name: string) => r[header.indexOf(name)] ?? '';
    const warnings: string[] = [];
    const txs: Transaction[] = [];
    const ignored = new Set<string>();

    for (const r of data) {
      const action = get(r, 'Action').toLowerCase();
      const base = {
        date: isoDate(get(r, 'Time')),
        securityId: '',
        isin: get(r, 'ISIN') || undefined,
        symbol: get(r, 'Ticker') || undefined,
        name: get(r, 'Name') || undefined,
        source: this.broker,
      };
      const shares = num(get(r, 'No. of shares'));
      if (/\b(buy|sell)\b/.test(action)) {
        const total = Math.abs(num(get(r, 'Total')));
        const currency = get(r, 'Currency (Total)') || get(r, 'Currency (Price / share)');
        if (!get(r, 'Total')) warnings.push(`${base.date} ${base.name}: no "Total" column, trade skipped.`);
        else
          txs.push({
            ...base,
            type: action.includes('buy') ? 'BUY' : 'SELL',
            quantity: shares,
            amount: total,
            fees: 0,
            currency,
          });
      } else if (action.startsWith('dividend')) {
        const currency = get(r, 'Currency (Price / share)');
        txs.push({ ...base, type: 'DIVIDEND', quantity: 0, amount: shares * num(get(r, 'Price / share')), fees: 0, currency });
        const wht = Math.abs(num(get(r, 'Withholding tax')));
        if (wht > 0) {
          txs.push({
            ...base,
            type: 'WITHHOLDING',
            quantity: 0,
            amount: wht,
            fees: 0,
            currency: get(r, 'Currency (Withholding tax)') || currency,
          });
        }
      } else if (action) {
        ignored.add(get(r, 'Action'));
      }
    }
    const notCash = [...ignored].filter((a) => !/deposit|withdrawal|interest|conversion|card|lending/i.test(a));
    if (notCash.length) warnings.push(`Ignored rows of type: ${notCash.join(', ')}. Check whether they affect your shares.`);
    return { broker: this.broker, transactions: finalize(txs), warnings };
  },
};
