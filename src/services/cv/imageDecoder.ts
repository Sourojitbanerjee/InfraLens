import { ImagePixelBuffer } from './types';

/**
 * Universal Image Decoder for Browser and Node.js
 * Converts data URLs, blob URLs, image elements, or binary buffers into an ImagePixelBuffer (RGBA Uint8ClampedArray)
 */
export class ImageDecoder {
  /**
   * Decode an image source (data URL, image URL, or base64) to ImagePixelBuffer
   */
  static async decode(source: string | ArrayBuffer | Uint8Array): Promise<ImagePixelBuffer> {
    // 1. Browser environment (HTMLCanvasElement / Image / createImageBitmap)
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      return this.decodeInBrowser(source);
    }

    // 2. Node.js environment
    return this.decodeInNode(source);
  }

  private static async decodeInBrowser(source: string | ArrayBuffer | Uint8Array): Promise<ImagePixelBuffer> {
    let srcUrl = '';
    let cleanupUrl: string | null = null;

    if (typeof source === 'string') {
      srcUrl = source;
    } else {
      const blob = new Blob([source as BlobPart], { type: 'image/png' });
      srcUrl = URL.createObjectURL(blob);
      cleanupUrl = srcUrl;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const width = img.naturalWidth || img.width;
          const height = img.naturalHeight || img.height;

          if (width === 0 || height === 0) {
            reject(new Error('Image has zero dimensions'));
            return;
          }

          // Limit maximum dimensions for performance while maintaining aspect ratio
          const maxDim = 1024;
          let drawWidth = width;
          let drawHeight = height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              drawWidth = maxDim;
              drawHeight = Math.round((height / width) * maxDim);
            } else {
              drawHeight = maxDim;
              drawWidth = Math.round((width / height) * maxDim);
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = drawWidth;
          canvas.height = drawHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          if (!ctx) {
            reject(new Error('Failed to create 2D canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, drawWidth, drawHeight);
          const imageData = ctx.getImageData(0, 0, drawWidth, drawHeight);

          if (cleanupUrl) {
            URL.revokeObjectURL(cleanupUrl);
          }

          resolve({
            width: drawWidth,
            height: drawHeight,
            data: imageData.data,
          });
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        if (cleanupUrl) URL.revokeObjectURL(cleanupUrl);
        reject(new Error('Failed to load image from source'));
      };

      img.src = srcUrl;
    });
  }

  private static async decodeInNode(source: string | ArrayBuffer | Uint8Array): Promise<ImagePixelBuffer> {
    let buffer: Buffer;

    if (typeof source === 'string') {
      if (source.startsWith('data:')) {
        const commaIdx = source.indexOf(',');
        const base64Data = commaIdx >= 0 ? source.slice(commaIdx + 1) : source;
        buffer = Buffer.from(base64Data, 'base64');
      } else if (source.startsWith('http://') || source.startsWith('https://')) {
        throw new Error('Remote HTTP image loading in Node.js requires an explicit buffer or local image.');
      } else {
        // Plain base64 or file path
        buffer = Buffer.from(source, 'base64');
      }
    } else if (source instanceof Uint8Array) {
      buffer = Buffer.from(source.buffer, source.byteOffset, source.byteLength);
    } else {
      buffer = Buffer.from(source);
    }

    if (buffer.length < 8) {
      throw new Error('Image data is too small to be valid (< 8 bytes)');
    }

    // Check PNG signature: 137 80 78 71 13 10 26 10
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return this.decodePngInNode(buffer);
    }

    // Check BMP signature: "BM" (0x42 0x4D)
    if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
      return this.decodeBmpInNode(buffer);
    }

    // Fallback: If raw RGBA payload with JSON header or known layout
    throw new Error('Unsupported image format in Node.js. Expected PNG or BMP format.');
  }

  /**
   * Pure Node.js PNG decoder supporting standard 8-bit truecolor (RGBA and RGB)
   */
  private static decodePngInNode(buf: Buffer): ImagePixelBuffer {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const zlib = require('zlib');
    let offset = 8;
    let width = 0;
    let height = 0;
    let bitDepth = 0;
    let colorType = 0;
    const idatChunks: Buffer[] = [];

    while (offset < buf.length) {
      if (offset + 8 > buf.length) break;
      const length = buf.readUInt32BE(offset);
      const type = buf.toString('ascii', offset + 4, offset + 8);
      const dataStart = offset + 8;
      const dataEnd = dataStart + length;

      if (type === 'IHDR') {
        width = buf.readUInt32BE(dataStart);
        height = buf.readUInt32BE(dataStart + 4);
        bitDepth = buf[dataStart + 8];
        colorType = buf[dataStart + 9];
      } else if (type === 'IDAT') {
        idatChunks.push(buf.subarray(dataStart, dataEnd));
      } else if (type === 'IEND') {
        break;
      }

      offset = dataEnd + 4; // skip CRC (4 bytes)
    }

    if (width === 0 || height === 0 || idatChunks.length === 0) {
      throw new Error('Corrupted PNG: missing IHDR or IDAT chunks');
    }

    const compressed = Buffer.concat(idatChunks);
    const decompressed = zlib.inflateSync(compressed);

    // Color types: 2 = RGB (3 bytes/px), 6 = RGBA (4 bytes/px), 0 = Grayscale (1 byte/px)
    const bytesPerPixel = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : 4;
    const stride = width * bytesPerPixel;
    const expectedLength = height * (stride + 1);

    if (decompressed.length < expectedLength) {
      throw new Error(`Incomplete PNG scanlines: expected ${expectedLength}, got ${decompressed.length}`);
    }

    const outData = new Uint8ClampedArray(width * height * 4);
    let srcOffset = 0;
    const prevRow = new Uint8Array(stride);
    const currRow = new Uint8Array(stride);

    for (let y = 0; y < height; y++) {
      const filterType = decompressed[srcOffset++];
      for (let i = 0; i < stride; i++) {
        currRow[i] = decompressed[srcOffset++];
      }

      // Filter unmasking
      if (filterType === 1) { // Sub
        for (let i = 0; i < stride; i++) {
          const left = i >= bytesPerPixel ? currRow[i - bytesPerPixel] : 0;
          currRow[i] = (currRow[i] + left) & 0xff;
        }
      } else if (filterType === 2) { // Up
        for (let i = 0; i < stride; i++) {
          currRow[i] = (currRow[i] + prevRow[i]) & 0xff;
        }
      } else if (filterType === 3) { // Average
        for (let i = 0; i < stride; i++) {
          const left = i >= bytesPerPixel ? currRow[i - bytesPerPixel] : 0;
          const up = prevRow[i];
          currRow[i] = (currRow[i] + Math.floor((left + up) / 2)) & 0xff;
        }
      } else if (filterType === 4) { // Paeth
        for (let i = 0; i < stride; i++) {
          const a = i >= bytesPerPixel ? currRow[i - bytesPerPixel] : 0;
          const b = prevRow[i];
          const c = i >= bytesPerPixel ? prevRow[i - bytesPerPixel] : 0;
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          let pr = a;
          if (pb < pa && pb < pc) pr = b;
          else if (pc < pa) pr = c;
          currRow[i] = (currRow[i] + pr) & 0xff;
        }
      }

      // Copy unmasked row to output RGBA buffer
      for (let x = 0; x < width; x++) {
        const outIdx = (y * width + x) * 4;
        const inIdx = x * bytesPerPixel;

        if (colorType === 6) { // RGBA
          outData[outIdx] = currRow[inIdx];
          outData[outIdx + 1] = currRow[inIdx + 1];
          outData[outIdx + 2] = currRow[inIdx + 2];
          outData[outIdx + 3] = currRow[inIdx + 3];
        } else if (colorType === 2) { // RGB
          outData[outIdx] = currRow[inIdx];
          outData[outIdx + 1] = currRow[inIdx + 1];
          outData[outIdx + 2] = currRow[inIdx + 2];
          outData[outIdx + 3] = 255;
        } else if (colorType === 0) { // Grayscale
          const g = currRow[inIdx];
          outData[outIdx] = g;
          outData[outIdx + 1] = g;
          outData[outIdx + 2] = g;
          outData[outIdx + 3] = 255;
        }
      }

      prevRow.set(currRow);
    }

    return { width, height, data: outData };
  }

  /**
   * Pure Node.js BMP decoder (24-bit / 32-bit uncompressed)
   */
  private static decodeBmpInNode(buf: Buffer): ImagePixelBuffer {
    const dataOffset = buf.readUInt32LE(10);
    const width = buf.readInt32LE(18);
    const rawHeight = buf.readInt32LE(22);
    const isTopDown = rawHeight < 0;
    const height = Math.abs(rawHeight);
    const bpp = buf.readUInt16LE(28);

    if (bpp !== 24 && bpp !== 32) {
      throw new Error(`Unsupported BMP bit depth: ${bpp} bpp (expected 24 or 32)`);
    }

    const rowBytes = Math.floor((bpp * width + 31) / 32) * 4;
    const outData = new Uint8ClampedArray(width * height * 4);
    const bytesPerPx = bpp / 8;

    for (let y = 0; y < height; y++) {
      const srcY = isTopDown ? y : height - 1 - y;
      const rowOffset = dataOffset + srcY * rowBytes;

      for (let x = 0; x < width; x++) {
        const pxOffset = rowOffset + x * bytesPerPx;
        const outIdx = (y * width + x) * 4;

        // BMP stores BGR or BGRA
        const b = buf[pxOffset];
        const g = buf[pxOffset + 1];
        const r = buf[pxOffset + 2];
        const a = bpp === 32 ? buf[pxOffset + 3] : 255;

        outData[outIdx] = r;
        outData[outIdx + 1] = g;
        outData[outIdx + 2] = b;
        outData[outIdx + 3] = a;
      }
    }

    return { width, height, data: outData };
  }

  /**
   * Helper to create a synthetic ImagePixelBuffer for tests or calibration
   */
  static createBuffer(width: number, height: number, fillR = 255, fillG = 255, fillB = 255, fillA = 255): ImagePixelBuffer {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = fillR;
      data[i + 1] = fillG;
      data[i + 2] = fillB;
      data[i + 3] = fillA;
    }
    return { width, height, data };
  }
}
