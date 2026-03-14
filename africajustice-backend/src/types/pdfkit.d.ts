declare module 'pdfkit' {
  import { Readable } from 'stream';

  export interface PDFDocumentOptions {
    size?: string | [number, number];
    margin?: number | { top?: number; left?: number; bottom?: number; right?: number };
    bufferPages?: boolean;
    autoFirstPage?: boolean;
    info?: {
      Title?: string;
      Author?: string;
      Subject?: string;
      Keywords?: string;
      Creator?: string;
      Producer?: string;
      CreationDate?: Date;
    };
  }

  export interface TextOptions {
    align?: 'left' | 'center' | 'right' | 'justify';
    width?: number;
    height?: number;
    ellipsis?: boolean | string;
    continued?: boolean;
    lineGap?: number;
    characterSpacing?: number;
    wordSpacing?: number;
    columns?: number;
    columnGap?: number;
    indent?: number;
    paragraphGap?: number;
    underline?: boolean;
    link?: string | number;
    destination?: string;
    goTo?: string | number;
    strike?: boolean;
  }

  export interface BufferedPageRange {
    count: number;
    start: number;
  }

  export default class PDFDocument extends Readable {
    constructor(options?: PDFDocumentOptions);

    text(text: string): this;
    text(text: string, x: number): this;
    text(text: string, x: number, y: number): this;
    text(text: string, x: number, y: number, options: TextOptions): this;
    text(text: string, options: TextOptions): this;
    fontSize(size: number): this;
    font(name: string, size?: number): this;
    fillColor(color: string | number[]): this;
    moveTo(x: number, y: number): this;
    moveDown(count?: number): this;
    lineTo(x: number, y: number): this;
    stroke(): this;
    rect(x: number, y: number, width: number, height: number): this;
    fill(): this;
    image(src: string | Buffer | Readable, x?: number, y?: number, options?: unknown): this;
    addPage(options?: PDFDocumentOptions): this;
    end(): this;
    switchToPage(index: number): this;
    bufferedPageRange(): BufferedPageRange;

    y: number;
    x: number;

    // For HTTP responses
    pipe(destination: unknown, options?: unknown): unknown;
  }
}

