import type { Transaction } from '../types';
import { ISIN_RE, finalize, isoDate, num, rows, type ParseResult, type Parser } from './util';

/**
 * Interactive Brokers "Activity Statement" exported as CSV.
 * Every line starts with the section name and "Header" or "Data".
 */
export const ibkrParser: Parser = {
  broker: 'Interactive Brokers',
  detect: (text) => /^﻿?Statement,Header,/m.test(text) || /^Trades,Header,DataDiscriminator/m.test(text),
  parse(text): ParseResult {
    const warnings: string[] = [];
    const txs: Transaction[] = [];
    const headers = new Map<string, string[]>();
    const instruments = new Map<string, { isin?: string; name?: string }>();
    const skippedCategories = new Set<string>();

    const all = rows(text);
    for (const r of all) {
      const [section, kind, ...rest] = r;
      if (kind === 'Header') {
        headers.set(section, rest);
        continue;
      }
      if (kind !== 'Data') continue;
      const h = headers.get(section) ?? [];
      const get = (name: string) => rest[h.indexOf(name)] ?? '';

      if (section === 'Financial Instrument Information') {
        const isin = get('Security ID');
        instruments.set(get('Symbol'), { isin: ISIN_RE.test(isin) ? isin : undefined, name: get('Description') });
      } else if (section === 'Trades') {
        if (get('DataDiscriminator') && get('DataDiscriminator') !== 'Order') continue;
        const category = get('Asset Category');
        if (category !== 'Stocks') {
          if (category) skippedCategories.add(category);
          continue;
        }
        const qty = num(get('Quantity'));
        const symbol = get('Symbol');
        txs.push({
          date: isoDate(get('Date/Time')),
          type: qty > 0 ? 'BUY' : 'SELL',
          securityId: '',
          symbol,
          quantity: Math.abs(qty),
          amount: Math.abs(num(get('Proceeds'))),
          fees: Math.abs(num(get('Comm/Fee') || get('Comm in USD'))),
          currency: get('Currency'),
          source: this.broker,
        });
      } else if (section === 'Dividends' || section === 'Withholding Tax') {
        const currency = get('Currency');
        if (!currency || currency.startsWith('Total')) continue;
        const desc = get('Description');
        const symbol = desc.match(/^([^(]+)\(/)?.[1].trim();
        const isin = desc.match(ISIN_RE)?.[1];
        const amount = num(get('Amount'));
        const isDividend = section === 'Dividends';
        txs.push({
          date: isoDate(get('Date')),
          type: isDividend ? 'DIVIDEND' : 'WITHHOLDING',
          securityId: '',
          symbol,
          isin,
          quantity: 0,
          // Withholding is negative; a refund shows as positive and reduces the total.
          amount: isDividend ? amount : -amount,
          fees: 0,
          currency,
          source: this.broker,
        });
      }
    }

    for (const t of txs) {
      const info = t.symbol ? instruments.get(t.symbol) : undefined;
      t.isin ??= info?.isin;
      t.name ??= info?.name;
    }
    if (skippedCategories.size) {
      warnings.push(`Skipped ${[...skippedCategories].join(', ')} trades. Only stocks and ETFs are handled.`);
    }
    if (!txs.length) {
      warnings.push('No trades or dividends were found in this Interactive Brokers file.');
    }
    return { broker: this.broker, transactions: finalize(txs), warnings };
  },
};
