import { describe, expect, it } from 'vitest';
import { calculate } from '../src/lib/engine/calculate';
import type { Transaction } from '../src/lib/types';

const fx10 = () => 10; // 1 USD = 10 NOK
const tx = (t: Partial<Transaction> & Pick<Transaction, 'date' | 'type'>): Transaction => ({
  securityId: 'US0378331005',
  isin: 'US0378331005',
  name: 'Apple Inc',
  quantity: 0,
  amount: 0,
  fees: 0,
  currency: 'USD',
  source: 'test',
  ...t,
});

describe('calculate', () => {
  it('uses FIFO and converts with the rate on each date', () => {
    const fx = (_c: string, d: string) => (d.startsWith('2024-01') ? 10 : 11);
    const r = calculate(
      [
        tx({ date: '2024-01-02', type: 'BUY', quantity: 10, amount: 1000, fees: 1 }),
        tx({ date: '2024-01-03', type: 'BUY', quantity: 10, amount: 2000 }),
        tx({ date: '2024-06-01', type: 'SELL', quantity: 10, amount: 1500, fees: 1 }),
      ],
      { taxYear: 2024, fx },
    );
    const s = r.securities[0];
    // Sold the first lot: cost (1000+1)*10, proceeds (1500-1)*11
    expect(s.sales[0].costNok).toBe(10010);
    expect(s.sales[0].proceedsNok).toBe(16489);
    expect(s.gainsNok).toBe(6479);
    expect(s.sharesAtYearEnd).toBe(10);
    expect(s.costAtYearEndNok).toBe(20000);
  });

  it('grants shield on shares held at year end and uses it against dividends first', () => {
    const r = calculate(
      [
        tx({ date: '2023-03-01', type: 'BUY', quantity: 10, amount: 10000 }), // cost 100 000 NOK
        tx({ date: '2024-05-01', type: 'DIVIDEND', amount: 200 }), // 2 000 NOK
        tx({ date: '2024-05-01', type: 'WITHHOLDING', amount: 30 }),
      ],
      { taxYear: 2024, fx: fx10 },
    );
    const s = r.securities[0];
    // 2023 shield: 100 000 × 3.2% = 3 200. 2024 shield: (100 000 + 3 200) × 3.9% = 4 024.80
    expect(s.shieldGrantedThisYearNok).toBe(4024.8);
    expect(s.shieldUsedOnDividendsNok).toBe(2000);
    expect(s.taxableDividendsNok).toBe(0);
    expect(s.unusedShieldAtYearEndNok).toBe(5224.8);
    expect(s.withholdingNok).toBe(300);
  });

  it('uses unused shield against a gain but never to create a loss', () => {
    const base = [tx({ date: '2023-03-01', type: 'BUY', quantity: 10, amount: 10000 })];
    const gain = calculate([...base, tx({ date: '2024-02-01', type: 'SELL', quantity: 10, amount: 10200 })], {
      taxYear: 2024,
      fx: fx10,
    });
    // Gain 2 000, shield from 2023 is 3 200 → taxable gain 0
    expect(gain.securities[0].sales[0].resultNok).toBe(2000);
    expect(gain.securities[0].shieldUsedOnGainsNok).toBe(2000);
    expect(gain.totals.gainsNok).toBe(0);

    const loss = calculate([...base, tx({ date: '2024-02-01', type: 'SELL', quantity: 10, amount: 9000 })], {
      taxYear: 2024,
      fx: fx10,
    });
    expect(loss.totals.lossesNok).toBe(-10000);
    expect(loss.securities[0].shieldUsedOnGainsNok).toBe(0);
  });

  it('does not grant shield for shares sold during the year', () => {
    const r = calculate(
      [
        tx({ date: '2024-01-10', type: 'BUY', quantity: 5, amount: 500 }),
        tx({ date: '2024-11-10', type: 'SELL', quantity: 5, amount: 600 }),
      ],
      { taxYear: 2024, fx: fx10 },
    );
    expect(r.securities[0].shieldUsedOnGainsNok).toBe(0);
    expect(r.securities[0].gainsNok).toBe(1000);
    expect(r.securities[0].shieldGrantedThisYearNok).toBe(0);
  });

  it('estimates tax with the upward factor', () => {
    const r = calculate(
      [
        tx({ date: '2024-01-10', type: 'BUY', quantity: 5, amount: 500 }),
        tx({ date: '2024-11-10', type: 'SELL', quantity: 5, amount: 600 }),
      ],
      { taxYear: 2024, fx: fx10 },
    );
    expect(r.totals.estimatedTaxNok).toBe(378.4); // 1000 × 1.72 × 22%
  });

  it('warns when more shares are sold than bought', () => {
    const r = calculate([tx({ date: '2024-02-01', type: 'SELL', quantity: 3, amount: 300 })], { taxYear: 2024, fx: fx10 });
    expect(r.warnings[0]).toMatch(/more shares than the files show/);
    expect(r.totals.gainsNok).toBe(3000);
  });

  it('warns about years without a shield rate', () => {
    const r = calculate([tx({ date: '2017-02-01', type: 'BUY', quantity: 1, amount: 100 })], { taxYear: 2024, fx: fx10 });
    expect(r.warnings.join(' ')).toMatch(/2017, 2018/);
  });

  it('ignores transactions after the tax year and rejects unsupported years', () => {
    const r = calculate([tx({ date: '2025-02-01', type: 'BUY', quantity: 1, amount: 100 })], { taxYear: 2024, fx: fx10 });
    expect(r.securities).toHaveLength(0);
    expect(() => calculate([], { taxYear: 2021, fx: fx10 })).toThrow();
  });
});
