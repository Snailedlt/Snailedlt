import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MissingRateError, norgesBankUrl, parseNorgesBankCsv } from '../src/lib/fx/rates';

const table = parseNorgesBankCsv(readFileSync(new URL('./fixtures/norgesbank.csv', import.meta.url), 'utf8'));

describe('Norges Bank rates', () => {
  it('reads the CSV and applies unit multipliers', () => {
    expect(table.lookup('USD', '2024-03-01')).toBe(10.5912);
    expect(table.lookup('SEK', '2024-03-01')).toBeCloseTo(1.0231);
    expect(table.lookup('NOK', '2024-03-01')).toBe(1);
  });
  it('falls back to the last business day for weekends', () => {
    expect(table.lookup('USD', '2024-03-03')).toBe(10.5912); // Sunday
  });
  it('throws for unknown currencies and dates outside the data', () => {
    expect(() => table.lookup('JPY', '2024-03-01')).toThrow(MissingRateError);
    expect(() => table.lookup('USD', '2024-02-01')).toThrow(MissingRateError);
    expect(() => table.lookup('USD', '2024-04-01')).toThrow(MissingRateError);
  });
  it('builds the API URL', () => {
    expect(norgesBankUrl(['USD', 'EUR'], '2024-01-01', '2024-12-31')).toContain('EXR/B.USD+EUR.NOK.SP');
  });
});
