import { Logger } from '@backend/middlewares';
import { pdfToPng } from 'pdf-to-png-converter';
import sharp from 'sharp';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
/** Prefer sharper primary render for STEG digit OCR; fallbacks if blank. */
const PDF_VIEWPORT_SCALES = [4.0, 3.0, 2.0] as const;
const PDF_PAGES_TO_TRY = [1, 2] as const;
/** Caps vision tiles while keeping STEG text readable (was 1600). */
const VISION_MAX_EDGE_PX = 2048;
const VISION_JPEG_QUALITY = 90;

export interface VisionImageOptions {
  maxEdgePx?: number;
  jpegQuality?: number;
}

export function isPdfBuffer(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer.subarray(0, 4).toString() === '%PDF';
}

export function resolveBillMimeType(buffer: Buffer, mimeType: string): string {
  if (isPdfBuffer(buffer)) {
    return 'application/pdf';
  }
  return mimeType;
}

function isValidPng(buffer: Buffer): boolean {
  return buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_SIGNATURE);
}

/** Detect mostly-blank renders (common when pdf-to-png fails silently). */
export async function isLikelyBlankPng(buffer: Buffer): Promise<boolean> {
  const stats = await sharp(buffer).grayscale().stats();
  const channel = stats.channels[0];
  if (!channel) {
    return true;
  }
  return channel.mean > 235 && channel.stdev < 18;
}

async function enhanceBillPng(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer).normalize().sharpen({ sigma: 1 }).png({ compressionLevel: 6 }).toBuffer();
}

/**
 * Downscale + JPEG so OpenRouter detail=high stays under prompt-token credit limits.
 */
export async function downscaleBillImageForVision(
  buffer: Buffer,
  options: VisionImageOptions = {}
): Promise<{ buffer: Buffer; mimeType: 'image/jpeg' }> {
  const maxEdgePx = options.maxEdgePx ?? VISION_MAX_EDGE_PX;
  const jpegQuality = options.jpegQuality ?? VISION_JPEG_QUALITY;
  const meta = await sharp(buffer).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  const needsResize = width > maxEdgePx || height > maxEdgePx;

  let pipeline = sharp(buffer).rotate();
  if (needsResize) {
    pipeline = pipeline.resize({
      width: maxEdgePx,
      height: maxEdgePx,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  const output = await pipeline.jpeg({ quality: jpegQuality, mozjpeg: true }).toBuffer();
  Logger.info(
    `Vision image prepared: ${width}x${height} → jpeg ${output.length} bytes` +
      (needsResize ? ` (max edge ${maxEdgePx}px)` : '') +
      ` q=${jpegQuality}`
  );
  return { buffer: output, mimeType: 'image/jpeg' };
}

async function renderPdfPage(buffer: Buffer, page: number, scale: number): Promise<Buffer | null> {
  const pngPages = await pdfToPng(buffer, {
    pagesToProcess: [page],
    viewportScale: scale,
    disableFontFace: false,
    useSystemFonts: true,
    outputType: 'png',
    responseType: 'buffer',
    useWorker: false,
    enableXfa: true,
    strict: false,
  });

  const firstPage = pngPages[0];
  if (!firstPage?.content) {
    return null;
  }

  const pageBuffer = firstPage.content as Buffer;
  if (!Buffer.isBuffer(pageBuffer) || pageBuffer.length === 0) {
    return null;
  }

  return pageBuffer;
}

export interface PdfConversionResult {
  buffer: Buffer;
  mimeType: 'image/png';
  page: number;
  scale: number;
}

async function stitchPngBuffersVertically(buffers: Buffer[]): Promise<Buffer> {
  const metas = await Promise.all(
    buffers.map(async (buffer) => ({
      buffer,
      meta: await sharp(buffer).metadata(),
    }))
  );

  const width = Math.max(...metas.map((item) => item.meta.width ?? 0));
  const height = metas.reduce((sum, item) => sum + (item.meta.height ?? 0), 0);

  let top = 0;
  const composites = metas.map((item) => {
    const composite = { input: item.buffer, top, left: 0 };
    top += item.meta.height ?? 0;
    return composite;
  });

  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite(composites)
    .png({ compressionLevel: 6 })
    .toBuffer();
}

export async function convertPdfBillToPng(buffer: Buffer): Promise<PdfConversionResult> {
  Logger.info(
    `PDF detected (size: ${buffer.length} bytes). Converting to PNG for vision processing...`
  );

  const scale = PDF_VIEWPORT_SCALES[0];
  const pageBuffers: Buffer[] = [];

  for (const page of PDF_PAGES_TO_TRY) {
    try {
      const rawPng = await renderPdfPage(buffer, page, scale);
      if (!rawPng) {
        continue;
      }
      const enhanced = await enhanceBillPng(rawPng);
      if (!(await isLikelyBlankPng(enhanced))) {
        pageBuffers.push(enhanced);
      }
    } catch (error) {
      Logger.warn(`PDF render failed (page=${page}, scale=${scale}): ${String(error)}`);
    }
  }

  if (pageBuffers.length >= 2) {
    const stitched = await stitchPngBuffersVertically(pageBuffers);
    Logger.info(
      `PDF stitched ${pageBuffers.length} pages → PNG ${stitched.length} bytes (scale=${scale})`
    );
    return { buffer: stitched, mimeType: 'image/png', page: 1, scale };
  }

  if (pageBuffers.length === 1) {
    return { buffer: pageBuffers[0], mimeType: 'image/png', page: 1, scale };
  }

  let bestCandidate: { buffer: Buffer; page: number; scale: number; stdev: number } | null = null;

  for (const page of PDF_PAGES_TO_TRY) {
    for (const fallbackScale of PDF_VIEWPORT_SCALES) {
      try {
        Logger.info(`PDF render attempt: page=${page}, scale=${fallbackScale}`);
        const rawPng = await renderPdfPage(buffer, page, fallbackScale);
        if (!rawPng) {
          continue;
        }

        const enhanced = await enhanceBillPng(rawPng);
        const stats = await sharp(enhanced).grayscale().stats();
        const stdev = stats.channels[0]?.stdev ?? 0;
        const isBlank = await isLikelyBlankPng(enhanced);

        Logger.info(
          `PDF render result: page=${page}, scale=${fallbackScale}, size=${enhanced.length} bytes, ` +
            `blank=${isBlank}, stdev=${stdev.toFixed(2)}, validPng=${isValidPng(enhanced)}`
        );

        if (!isBlank) {
          return { buffer: enhanced, mimeType: 'image/png', page, scale: fallbackScale };
        }

        if (!bestCandidate || stdev > bestCandidate.stdev) {
          bestCandidate = { buffer: enhanced, page, scale: fallbackScale, stdev };
        }
      } catch (error) {
        Logger.warn(`PDF render failed (page=${page}, scale=${fallbackScale}): ${String(error)}`);
      }
    }
  }

  if (bestCandidate) {
    Logger.warn(
      `All PDF renders looked blank; using best candidate (page=${bestCandidate.page}, ` +
        `scale=${bestCandidate.scale}, stdev=${bestCandidate.stdev.toFixed(2)})`
    );
    return {
      buffer: bestCandidate.buffer,
      mimeType: 'image/png',
      page: bestCandidate.page,
      scale: bestCandidate.scale,
    };
  }

  throw new Error('PDF conversion produced no usable image');
}
