declare module 'json2csv' {
  export interface ParserOptions {
    fields?: Array<{ label: string; value: string | ((row: Record<string, unknown>) => unknown) }> | string[];
    header?: boolean;
    delimiter?: string;
    quote?: string;
    escape?: string;
    escapeFormulas?: boolean;
    transforms?: Array<(value: unknown) => unknown>;
    withBOM?: boolean;
  }

  export class Parser {
    constructor(options?: ParserOptions);
    parse(data: unknown[]): string;
  }

  export function parse(data: unknown[], options?: ParserOptions): string;
}
