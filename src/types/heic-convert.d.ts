declare module 'heic-convert' {
  interface ConvertOptions {
    buffer: Buffer;
    format: 'jpeg' | 'png';
    quality?: number;
  }
  
  function convert(options: ConvertOptions): Promise<Buffer>;
  
  export default convert;
}
