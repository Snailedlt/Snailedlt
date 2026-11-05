import type { Transaction } from '../types';
import { finalize, isoDate, num, rows, type ParseResult, type Parser } from './util';

/**
 * DEGIRO "Transactions" CSV export (English). Currency columns have no header and sit to the right
 * of the amount they belong to. Uses "Total", which is in the account currency and includes costs.
 */
export const degiroParser: Parser = {
  broker: 'DEGIRO',
  detect: (text) => /^﻿?Date,Time,Product,ISIN,/.test(text),
  parse(text): ParseResult {
    const [header, ...data] = rows(text);
    const at = (name: string) => header.findIndex((h) => h.toLowerCase().startsWith(name.toLowerCase()));
    const i = {
      date: at('Date'),
      product: at('Product'),
      isin: at('ISIN'),
      qty: at('Quantity'),
      total: header.findIndex((h) => h === 'Total' || h === 'Total EUR'),
      value: header.findIndex((h) => h === 'Value' || h === 'Value EUR'),
    };
    const warnings: string[] = [];
    const txs: Transaction[] = [];
    const useTotal = i.total >= 0;
    const amountCol = useTotal ? i.total : i.value;
    if (amountCol < 0) {
      return { broker: this.broker, transactions: [], warnings: ['Could not find the "Total" column in this DEGIRO file.'] };
    }

    for (const r of data) {
      const qty = num(r[i.qty]);
      if (!qty) continue;
      const currencyCell = r[amountCol + 1] ?? '';
      const currency = /^[A-Z]{3}$/.test(currencyCell) ? currencyCell : header[amountCol].split(' ')[1] || 'EUR';
      txs.push({
        date: isoDate(r[i.date]),
        type: qty > 0 ? 'BUY' : 'SELL',
        securityId: '',
        isin: r[i.isin] || undefined,
        name: r[i.product] || undefined,
        quantity: Math.abs(qty),
        amount: Math.abs(num(r[amountCol])),
        fees: 0,
        currency,
        source: this.broker,
      });
    }
    warnings.push('DEGIRO lists dividends in the Account statement, not in Transactions. Dividends from DEGIRO are not included yet.');
    return { broker: this.broker, transactions: finalize(txs), warnings };
  },
};
