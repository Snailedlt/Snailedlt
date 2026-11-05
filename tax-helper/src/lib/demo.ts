import { RateTable } from './fx/rates';

/** Example data so people can try the tool without their own files. Rates are made up. */
export const DEMO_FILES: { name: string; text: string }[] = [
  {
    name: 'example-interactive-brokers.csv',
    text: `Statement,Header,Field Name,Field Value
Trades,Header,DataDiscriminator,Asset Category,Currency,Symbol,Date/Time,Quantity,T. Price,C. Price,Proceeds,Comm/Fee,Basis,Realized P/L,MTM P/L,Code
Trades,Data,Order,Stocks,USD,AAPL,"2023-03-01, 10:30:00",20,150,150,-3000,-1,3001,0,0,O
Trades,Data,Order,Stocks,USD,AAPL,"2024-09-02, 15:01:10",-10,220,220,2200,-1,-1500.5,698.5,0,C
Trades,Data,Order,Stocks,USD,VOO,"2024-02-12, 15:40:00",5,460,460,-2300,-1,2301,0,0,O
Dividends,Header,Currency,Date,Description,Amount
Dividends,Data,USD,2024-05-16,AAPL(US0378331005) Cash Dividend USD 0.25 per Share (Ordinary Dividend),5
Dividends,Data,USD,2024-12-27,VOO(US9229083632) Cash Dividend USD 1.74 per Share (Ordinary Dividend),8.7
Withholding Tax,Header,Currency,Date,Description,Amount,Code
Withholding Tax,Data,USD,2024-05-16,AAPL(US0378331005) Cash Dividend USD 0.25 per Share - US Tax,-0.75,
Withholding Tax,Data,USD,2024-12-27,VOO(US9229083632) Cash Dividend USD 1.74 per Share - US Tax,-1.31,
Financial Instrument Information,Header,Asset Category,Symbol,Description,Conid,Security ID,Listing Exch,Multiplier,Type,Code
Financial Instrument Information,Data,Stocks,AAPL,APPLE INC,265598,US0378331005,NASDAQ,1,COMMON,
Financial Instrument Information,Data,Stocks,VOO,VANGUARD S&P 500 ETF,136155102,US9229083632,ARCA,1,ETF,
`,
  },
  {
    name: 'example-trading212.csv',
    text: `Action,Time,ISIN,Ticker,Name,No. of shares,Price / share,Currency (Price / share),Exchange rate,Result,Currency (Result),Total,Currency (Total),Withholding tax,Currency (Withholding tax)
Market buy,2024-01-10 15:30:01,US5949181045,MSFT,Microsoft,3,375.00,USD,0.0951,,,11835.00,NOK,,
Dividend (Dividend),2024-03-14 11:00:00,US5949181045,MSFT,Microsoft,3,0.75,USD,,,,20.30,NOK,0.34,USD
Market sell,2024-11-20 16:00:00,US5949181045,MSFT,Microsoft,1,415.00,USD,0.0905,640.00,NOK,4585.00,NOK,,
`,
  },
];

export const DEMO_YEAR = 2024;

/** Flat example rates: 1 USD = 10.60 NOK every day. */
export function demoRates(): RateTable {
  const t = new RateTable();
  for (let d = Date.parse('2022-12-01'); d <= Date.parse('2024-12-31'); d += 86_400_000) {
    t.add('USD', new Date(d).toISOString().slice(0, 10), 10.6);
  }
  return t.sort();
}
