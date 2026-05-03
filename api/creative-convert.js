const { createCanvas, loadImage } = require('@napi-rs/canvas');

let pdfjsPromise;

function setHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function toBase64(buffer) {
  return Buffer.from(buffer).toString('base64');
}

function parseDataUrl(data = '') {
  const value = String(data || '');
  return value.includes(',') ? value.split(',').pop() : value;
}

function normalizeName(name = 'creative-file') {
  return String(name)
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'creative-file';
}

function getMimeAndExt(action) {
  if (action.endsWith('-jpg')) return { mime: 'image/jpeg', ext: 'jpg' };
  return { mime: 'image/png', ext: 'png' };
}

async function renderViaCanvas(imageInput, mimeType, quality = 0.92, width, height) {
  const image = await loadImage(imageInput);
  const targetWidth = width && width > 0 ? width : image.width;
  const targetHeight = height && height > 0 ? height : image.height;

  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  if (mimeType === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  if (mimeType === 'image/jpeg') {
    return canvas.toBuffer('image/jpeg', { quality: Math.max(0.35, Math.min(1, Number(quality) || 0.92)) });
  }
  return canvas.toBuffer('image/png');
}

function extractJpegFromPsd(buffer) {
  let best = null;
  for (let i = 0; i < buffer.length - 1; i += 1) {
    if (buffer[i] === 0xff && buffer[i + 1] === 0xd8) {
      for (let j = i + 2; j < buffer.length - 1; j += 1) {
        if (buffer[j] === 0xff && buffer[j + 1] === 0xd9) {
          const candidate = buffer.subarray(i, j + 2);
          if (!best || candidate.length > best.length) best = candidate;
          i = j;
          break;
        }
      }
    }
  }
  return best;
}

async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return pdfjsPromise;
}

async function renderAiPreview(aiBuffer, mimeType, quality = 0.92) {
  const pdfjs = await getPdfjs();
  const task = pdfjs.getDocument({
    data: new Uint8Array(aiBuffer),
    disableWorker: true,
    disableFontFace: true,
    isEvalSupported: false,
    useWorkerFetch: false,
    verbosity: pdfjs.VerbosityLevel?.ERRORS || 0
  });
  const pdf = await task.promise;
  try {
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const ctx = canvas.getContext('2d');
    if (mimeType === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    await page.render({ canvasContext: ctx, viewport }).promise;
    page.cleanup?.();
    if (mimeType === 'image/jpeg') {
      return canvas.toBuffer('image/jpeg', { quality: Math.max(0.35, Math.min(1, Number(quality) || 0.92)) });
    }
    return canvas.toBuffer('image/png');
  } finally {
    await pdf.destroy?.();
  }
}

module.exports = async function handler(req, res) {
  setHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { action, file, options = {} } = req.body || {};
    const allowed = new Set(['svg-to-png', 'svg-to-jpg', 'ai-to-png', 'ai-to-jpg', 'psd-to-png', 'psd-to-jpg']);
    if (!allowed.has(action)) {
      return res.status(400).json({ success: false, error: 'Unsupported action' });
    }

    const { mime, ext } = getMimeAndExt(action);
    const quality = Number(options.quality || 0.92);
    const width = Number(options.width || 0);
    const height = Number(options.height || 0);
    const baseName = normalizeName(file?.name || action);
    const warnings = [];
    let outputBuffer;

    if (action.startsWith('svg-to-')) {
      const svgText = String(options.svgText || '');
      const svgSource = svgText.trim()
        ? Buffer.from(svgText, 'utf8')
        : Buffer.from(parseDataUrl(file?.data || ''), 'base64');
      outputBuffer = await renderViaCanvas(svgSource, mime, quality, width, height);
    } else if (action.startsWith('ai-to-')) {
      const aiBuffer = Buffer.from(parseDataUrl(file?.data || ''), 'base64');
      try {
        outputBuffer = await renderAiPreview(aiBuffer, mime, quality);
      } catch (err) {
        return res.status(400).json({
          success: false,
          error: 'AI preview unavailable. Save the .AI with "Create PDF Compatible File" enabled, then try again.'
        });
      }
    } else if (action.startsWith('psd-to-')) {
      const psdBuffer = Buffer.from(parseDataUrl(file?.data || ''), 'base64');
      const jpegPreview = extractJpegFromPsd(psdBuffer);
      if (!jpegPreview) {
        return res.status(400).json({
          success: false,
          error: 'PSD preview not found. Re-save PSD with compatibility/composite preview enabled and retry.'
        });
      }
      outputBuffer = await renderViaCanvas(jpegPreview, mime, quality, width, height);
      warnings.push('Converted using embedded PSD preview/composite image.');
    }

    return res.status(200).json({
      success: true,
      file: {
        fileName: `${baseName}.${ext}`,
        mimeType: mime,
        size: outputBuffer.length,
        data: toBase64(outputBuffer)
      },
      warnings
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Conversion failed' });
  }
};

