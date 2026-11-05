import type { Transaction, TxType } from '../types';
import { finalize, isoDate, num, rows, type ParseResult, type Parser } from './util';

/** Our own template, for brokers we don't support yet. */
export const GENERIC_HEADER = ['date', 'type', 'isin', 'symbol', 'name', 'quantity', 'amount', 'fees', 'currency'];

export const genericParser: Parser = {
  broker: 'Generic template',
  detect: (text) => {
    const head = rows(text.split(/\r?\n/, 1)[0] ?? '')[0] ?? [];
    return ['date', 'type', 'amount', 'currency'].every((h) => head.map((c) => c.toLowerCase()).includes(h));
  },
  parse(text): ParseResult {
    const [header, ...data] = rows(text);
    const col = (name: string) => header.findIndex((h) => h.toLowerCase() === name);
    const idx = Object.fromEntries(GENERIC_HEADER.map((h) => [h, col(h)]));
    const warnings: string[] = [];
    const txs: Transaction[] = [];
    data.forEach((r, n) => {
      const type = r[idx.type]?.toUpperCase() as TxType;
      if (!['BUY', 'SELL', 'DIVIDEND', 'WITHHOLDING'].includes(type)) {
        warnings.push(`Row ${n + 2}: unknown type "${r[idx.type]}", skipped.`);
        return;
      }
      txs.push({
        date: isoDate(r[idx.date]),
        type,
        securityId: '',
        isin: r[idx.isin] || undefined,
        symbol: r[idx.symbol] || undefined,
        name: r[idx.name] || undefined,
        quantity: Math.abs(num(r[idx.quantity])),
        amount: Math.abs(num(r[idx.amount])),
        fees: Math.abs(num(r[idx.fees])),
        currency: (r[idx.currency] || 'NOK').toUpperCase(),
        source: 'Generic template',
      });
    });
    return { broker: this.broker, transactions: finalize(txs), warnings };
  },
};
