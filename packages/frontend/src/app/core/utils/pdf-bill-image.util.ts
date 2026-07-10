import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist';

let workerConfigured = false;

function ensurePdfWorker(): void {
  if (workerConfigured) {
    return;
  }
  GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
  workerConfigured = true;
}

function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

function scoreCanvasContent(canvas: HTMLCanvasElement): number {
  const context = canvas.getContext('2d');
  if (!context) {
    return 0;
  }

  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  let sum = 0;
  let sumSquares = 0;
  let samples = 0;
  const stride = 40;

  for (let index = 0; index < data.length; index += stride) {
    const gray = data[index];
    sum += gray;
    sumSquares += gray * gray;
    samples += 1;
  }

  if (samples === 0) {
    return 0;
  }

  const mean = sum / samples;
  return sumSquares / samples - mean * mean;
}

async function renderPdfPage(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  scale: number
): Promise<HTMLCanvasElement> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D context unavailable');
  }

  await page.render({ canvasContext: context, viewport }).promise;
  return canvas;
}

async function canvasToPngFile(canvas: HTMLCanvasElement, fileName: string): Promise<File> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
          return;
        }
        reject(new Error('PNG export failed'));
      },
      'image/png',
      0.92
    );
  });

  return new File([blob], fileName, { type: 'image/png' });
}

function stitchCanvasesVertically(canvases: HTMLCanvasElement[]): HTMLCanvasElement {
  const width = Math.max(...canvases.map((canvas) => canvas.width));
  const height = canvases.reduce((sum, canvas) => sum + canvas.height, 0);
  const stitched = document.createElement('canvas');
  stitched.width = width;
  stitched.height = height;

  const context = stitched.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D context unavailable');
  }

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);

  let offsetY = 0;
  for (const canvas of canvases) {
    context.drawImage(canvas, 0, offsetY);
    offsetY += canvas.height;
  }

  return stitched;
}

/**
 * Renders a PDF bill to PNG in the browser (better font/layout support than server-side).
 * Stitches pages 1+2 vertically when the bill spans multiple pages (common BT STEG).
 */
export async function convertPdfFileToImageFile(pdfFile: File, scale = 2.5): Promise<File> {
  if (!isPdfFile(pdfFile)) {
    return pdfFile;
  }

  ensurePdfWorker();

  const bytes = await pdfFile.arrayBuffer();
  const pdf = await getDocument({ data: bytes }).promise;
  const pagesToRender = Math.min(pdf.numPages, 2);
  const pageCanvases: HTMLCanvasElement[] = [];

  for (let pageNumber = 1; pageNumber <= pagesToRender; pageNumber += 1) {
    const canvas = await renderPdfPage(pdf, pageNumber, scale);
    const score = scoreCanvasContent(canvas);
    if (score >= 50) {
      pageCanvases.push(canvas);
    }
  }

  if (pageCanvases.length === 0) {
    throw new Error('PDF page appears blank after conversion');
  }

  const outputCanvas =
    pageCanvases.length === 1 ? pageCanvases[0] : stitchCanvasesVertically(pageCanvases);

  const baseName = pdfFile.name.replace(/\.pdf$/i, '');
  const suffix = pageCanvases.length > 1 ? '-p1-2' : '-p1';
  return canvasToPngFile(outputCanvas, `${baseName}${suffix}.png`);
}

export { isPdfFile };
