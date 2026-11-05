import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseFile } from '../src/lib/parsers';
import { isoDate, num } from '../src/lib/parsers/util';

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

describe('helpers', () => {
  it('parses numbers in both decimal styles', () => {
    expect(num('1,234.56')).toBe(1234.56);
    expect(num('1.234,56')).toBe(1234.56);
    expect(num('-2,00')).toBe(-2);
    expect(num('')).toBe(0);
  });
  it('parses dates', () => {
    expect(isoDate('2024-03-01, 10:30:00')).toBe('2024-03-01');
    expect(isoDate('05-02-2024')).toBe('2024-02-05');
    expect(isoDate('20240301')).toBe('2024-03-01');
  });
});

describe('Interactive Brokers', () => {
  const r = parseFile(fixture('ibkr.csv'));
  it('detects and reads stock trades, dividends and withholding', () => {
    expect(r.broker).toBe('Interactive Brokers');
    expect(r.transactions.map((t) => t.type)).toEqual(['BUY', 'SELL', 'DIVIDEND', 'WITHHOLDING']);
    const [buy, sell, div, wht] = r.transactions;
    expect(buy).toMatchObject({ date: '2024-03-01', quantity: 10, amount: 1805, fees: 1, currency: 'USD' });
    expect(sell).toMatchObject({ quantity: 4, amount: 880, fees: 1 });
    expect(div.amount).toBe(2.5);
    expect(wht.amount).toBe(0.38);
    expect(new Set(r.transactions.map((t) => t.securityId))).toEqual(new Set(['US0378331005']));
    expect(buy.name).toBe('APPLE INC');
  });
  it('warns about skipped non-stock trades', () => {
    expect(r.warnings.join(' ')).toMatch(/Forex/);
  });
});

describe('Trading 212', () => {
  const r = parseFile(fixture('trading212.csv'));
  it('uses account-currency totals for trades and gross amounts for dividends', () => {
    expect(r.broker).toBe('Trading 212');
    const [buy, div, wht, sell] = r.transactions;
    expect(buy).toMatchObject({ type: 'BUY', quantity: 2.5, amount: 9867.5, currency: 'NOK', securityId: 'US5949181045' });
    expect(div).toMatchObject({ type: 'DIVIDEND', amount: 1.875, currency: 'USD' });
    expect(wht).toMatchObject({ type: 'WITHHOLDING', amount: 0.28, currency: 'USD' });
    expect(sell).toMatchObject({ type: 'SELL', quantity: 1, amount: 4570.2 });
  });
  it('flags ignored corporate actions but not cash movements', () => {
    expect(r.warnings.join(' ')).toMatch(/Stock split open/);
    expect(r.warnings.join(' ')).not.toMatch(/Deposit/);
  });
});

describe('DEGIRO', () => {
  const r = parseFile(fixture('degiro.csv'));
  it('reads comma-decimal totals including costs', () => {
    expect(r.broker).toBe('DEGIRO');
    expect(r.transactions[0]).toMatchObject({ type: 'BUY', quantity: 3, amount: 2342, currency: 'EUR', date: '2024-02-05' });
    expect(r.transactions[1]).toMatchObject({ type: 'SELL', quantity: 1, amount: 818.5 });
  });
});

describe('Generic template', () => {
  it('reads our own format', () => {
    const r = parseFile(fixture('generic.csv'));
    expect(r.broker).toBe('Generic template');
    expect(r.transactions).toHaveLength(3);
    expect(r.transactions[0]).toMatchObject({ type: 'BUY', fees: 39, currency: 'SEK' });
  });
});

it('rejects files it does not recognize', () => {
  expect(() => parseFile('foo,bar\n1,2', 'x.csv')).toThrow(/doesn't look like/);
});
