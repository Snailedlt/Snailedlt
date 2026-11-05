import { degiroParser } from './degiro';
import { genericParser } from './generic';
import { ibkrParser } from './ibkr';
import { trading212Parser } from './trading212';
import type { ParseResult, Parser } from './util';

export const PARSERS: Parser[] = [ibkrParser, trading212Parser, degiroParser, genericParser];

export function parseFile(text: string, fileName = 'file'): ParseResult {
  const parser = PARSERS.find((p) => p.detect(text));
  if (!parser) {
    throw new Error(
      `${fileName}: this doesn't look like an export we can read. Supported: ${PARSERS.map((p) => p.broker).join(', ')}.`,
    );
  }
  return parser.parse(text);
}

export type { ParseResult };
