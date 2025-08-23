
/// <reference types="node" />

declare module 'wav' {
  import { Transform, TransformOptions } from 'stream';

  export interface WriterOptions extends TransformOptions {
    channels?: number;
    sampleRate?: number;
    bitDepth?: number;
    endianness?: 'LE' | 'BE';
    format?: number;
  }

  export class Writer extends Transform {
    constructor(options?: WriterOptions);
  }

  export interface ReaderOptions extends TransformOptions {
    // No specific options defined in the type definitions
  }

  export class Reader extends Transform {
    constructor(options?: ReaderOptions);
    on(event: 'format', listener: (format: {
      audioFormat: number;
      channels: number;
      sampleRate: number;
      byteRate: number;
      blockAlign: number;
      bitDepth: number;
      signed: boolean;
    }) => void): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this;
  }
}
