/** One normalized event from any broker export. All amounts are positive numbers in `currency`. */
export type TxType = 'BUY' | 'SELL' | 'DIVIDEND' | 'WITHHOLDING';

export interface Transaction {
  /** ISO date, YYYY-MM-DD (trade date). */
  date: string;
  type: TxType;
  /** Stable key for the security: ISIN when known, otherwise the ticker symbol. */
  securityId: string;
  isin?: string;
  symbol?: string;
  name?: string;
  /** Number of shares. Used for BUY and SELL; 0 for cash events. */
  quantity: number;
  /** Gross amount in `currency`: quantity × price for trades, gross dividend, or tax withheld. */
  amount: number;
  /** Commissions and fees in `currency`. Added to cost on buys, subtracted from proceeds on sells. */
  fees: number;
  /** ISO 4217 code of `amount` and `fees`. */
  currency: string;
  /** Which export the row came from, e.g. "Interactive Brokers". */
  source: string;
}

/** Returns how many NOK one unit of `currency` was worth on `date`. */
export type FxLookup = (currency: string, date: string) => number;
