# Foreign broker tax helper (beta)

Turns exports from foreign brokers into the figures Norwegian investors need for the tax return
(skattemeldingen): gains, losses, dividends, foreign tax withheld and the shielding deduction
(skjermingsfradrag), in NOK and per company.

Everything runs in the browser. Files are never uploaded.

## Run it

```bash
npm install
npm run dev      # local dev server
npm test         # unit tests (engine, parsers, exchange rates)
npm run check    # type check
npm run build    # static site in dist/, can be hosted anywhere
```

## What it does

| Step | Where |
|---|---|
| Read broker exports into one transaction format | `src/lib/parsers/` |
| Daily NOK exchange rates from Norges Bank, with the last business day used for weekends | `src/lib/fx/rates.ts` |
| FIFO, NOK conversion, shielding and dividends | `src/lib/engine/calculate.ts` |
| Shield rates and upward factors per year | `src/lib/engine/rates.ts` |

Supported exports: Interactive Brokers (Activity Statement CSV), Trading 212 (History CSV),
DEGIRO (Transactions CSV) and a generic template (`date,type,isin,symbol,name,quantity,amount,fees,currency`).

## Tax rules implemented

- First in, first out across all files (skatteloven § 10-36).
- Cost and proceeds converted to NOK at Norges Bank's rate on each trade date.
- Shares owned on 31 December get (cost + earlier unused shield) × the year's shield rate.
  The shield reduces that year's dividends first, then carries forward to reduce a later gain on the same shares.
  It never creates a loss and lapses on a sale at a loss.
- Gains, losses and taxable dividends × upward factor (1.72 for 2023–2025) × 22%.

## Known gaps

- Built from the brokers' documented formats, not yet tested against real exports. Test with real files before trusting it.
- The Norges Bank CSV format and browser access (CORS) are not verified yet. If the fetch fails, the app
  links to the rates file so the user can download it and drop it in.
- Not handled: stock splits and other corporate actions, currency gains on cash, DEGIRO dividends
  (they're in the Account statement), funds taxed as bond funds, shielding before 2019, wealth tax values.
- Dividends are shielded per company, not per share lot, which can be slightly off when shares
  were sold during the year.
- Verify shield rates and upward factors in `rates.ts` against skatteetaten.no each year.

## Freemium plan

Everything is free in this version. The planned paid step is the finished report: imports and the summary
stay free, and the per-company figures, sale breakdown and CSV download become the paid part.
