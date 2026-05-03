const { spawn } = require('child_process');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const JSZip = require('jszip');
const mammoth = require('mammoth');
const PptxGenJS = require('pptxgenjs');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const { PDFDocument, StandardFonts, degrees, rgb } = require('pdf-lib');

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_RENDER_PAGES = 20;
const A4 = [595.28, 841.89];

const ACTIONS = {
  'pdf-to-image': { label: 'PDF to Image', minFiles: 1, maxFiles: 1, accepts: ['pdf'] },
  'image-to-pdf': { label: 'Image to PDF', minFiles: 1, maxFiles: 40, accepts: ['image'] },
  'merge-pdf': { label: 'Merge PDF', minFiles: 2, maxFiles: 40, accepts: ['pdf'] },
  'split-pdf': { label: 'Split PDF', minFiles: 1, maxFiles: 1, accepts: ['pdf'] },
  'compress-pdf': { label: 'Compress PDF', minFiles: 1, maxFiles: 1, accepts: ['pdf'] },
  'rotate-pdf': { label: 'Rotate PDF', minFiles: 1, maxFiles: 1, accepts: ['pdf'] },
  'edit-pdf': { label: 'Edit PDF', minFiles: 1, maxFiles: 1, accepts: ['pdf'] },
  'lock-pdf': { label: 'Lock PDF', minFiles: 1, maxFiles: 1, accepts: ['pdf'] },
  'unlock-pdf': { label: 'Unlock PDF', minFiles: 1, maxFiles: 1, accepts: ['pdf'] },
  'add-watermark': { label: 'Add Watermark', minFiles: 1, maxFiles: 1, accepts: ['pdf'] },
  'extract-images': { label: 'Extract Images', minFiles: 1, maxFiles: 1, accepts: ['pdf'] },
  'extract-text': { label: 'Extract Text', minFiles: 1, maxFiles: 1, accepts: ['pdf'] },
  'pdf-to-word': { label: 'PDF to Word', minFiles: 1, maxFiles: 1, accepts: ['pdf'] },
  'word-to-pdf': { label: 'Word to PDF', minFiles: 1, maxFiles: 1, accepts: ['word'] },
  'pdf-to-powerpoint': { label: 'PDF to PowerPoint', minFiles: 1, maxFiles: 1, accepts: ['pdf'] },
  'pdf-to-excel': { label: 'PDF to Excel', minFiles: 1, maxFiles: 1, accepts: ['pdf'] },
  'powerpoint-to-pdf': { label: 'PowerPoint to PDF', minFiles: 1, maxFiles: 1, accepts: ['powerpoint'] },
  'excel-to-pdf': { label: 'Excel to PDF', minFiles: 1, maxFiles: 1, accepts: ['excel'] },
  'sign-pdf': { label: 'Sign PDF', minFiles: 1, maxFiles: 1, accepts: ['pdf'] },
  'html-to-pdf': { label: 'HTML to PDF', minFiles: 1, maxFiles: 1, accepts: ['html'] },
  'organize-pdf': { label: 'Organize PDF', minFiles: 1, maxFiles: 1, accepts: ['pdf'] },
  'pdf-to-pdfa': { label: 'PDF to PDF/A', minFiles: 1, maxFiles: 1, accepts: ['pdf'] },
  'repair-pdf': { label: 'Repair PDF', minFiles: 1, maxFiles: 1, accepts: ['pdf'] },
  'page-numbers': { label: 'Page Numbers', minFiles: 1, maxFiles: 1, accepts: ['pdf'] },
  'scan-to-pdf': { label: 'Scan to PDF', minFiles: 1, maxFiles: 40, accepts: ['image'] },
  'ocr-pdf': { label: 'OCR PDF', minFiles: 1, maxFiles: 1, accepts: ['pdf'] },
  'compare-pdf': { label: 'Compare PDF', minFiles: 2, maxFiles: 2, accepts: ['pdf'] },
  'redact-pdf': { label: 'Redact PDF', minFiles: 1, maxFiles: 1, accepts: ['pdf'] },
  'crop-pdf': { label: 'Crop PDF', minFiles: 1, maxFiles: 1, accepts: ['pdf'] },
  'ai-summarizer': { label: 'AI Summarizer', minFiles: 1, maxFiles: 1, accepts: ['pdf'] },
  'translate-pdf': { label: 'Translate PDF', minFiles: 1, maxFiles: 1, accepts: ['pdf'] }
};

let pdfjsPromise;

function setHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function apiError(res, status, message, details) {
  return res.status(status).json({ success: false, error: message, details });
}

function toBase64(buffer) {
  return Buffer.from(buffer).toString('base64');
}

function pdfLibBytes(buffer) {
  return new Uint8Array(buffer);
}

function sendOne(res, fileName, mimeType, buffer, warnings = []) {
  return res.status(200).json({
    success: true,
    file: {
      fileName,
      mimeType,
      size: buffer.length,
      data: toBase64(buffer)
    },
    warnings
  });
}

function sendMany(res, files, warnings = []) {
  return res.status(200).json({
    success: true,
    files: files.map((file) => ({
      fileName: file.fileName,
      mimeType: file.mimeType,
      size: file.buffer.length,
      data: toBase64(file.buffer)
    })),
    warnings
  });
}

function cleanBaseName(name = 'document') {
  return String(name)
    .split(/[\\/]/)
    .pop()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'document';
}

function decodeFiles(rawFiles) {
  if (!Array.isArray(rawFiles)) throw new Error('files must be an array');

  return rawFiles.map((file, index) => {
    const name = file.name || `file-${index + 1}`;
    let data = String(file.data || '');
    if (data.includes(',')) data = data.split(',').pop();
    const buffer = Buffer.from(data, 'base64');

    if (!buffer.length) throw new Error(`${name}: empty file`);
    if (buffer.length > MAX_FILE_BYTES) {
      throw new Error(`${name}: file is too large. Max ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB per file.`);
    }

    return {
      name,
      type: file.type || '',
      buffer,
      base: cleanBaseName(name)
    };
  });
}

function isPdf(file) {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name) || file.buffer.subarray(0, 4).toString() === '%PDF';
}

function isImage(file) {
  return /^image\/(png|jpe?g)$/i.test(file.type) || /\.(png|jpe?g)$/i.test(file.name);
}

function isWord(file) {
  return /wordprocessingml\.document/i.test(file.type) || /\.docx$/i.test(file.name);
}

function isPowerPoint(file) {
  return /presentationml\.presentation/i.test(file.type) || /\.pptx$/i.test(file.name);
}

function isExcel(file) {
  return /spreadsheetml\.sheet/i.test(file.type) || /\.xlsx$/i.test(file.name);
}

function isHtml(file) {
  return /^text\/html$/i.test(file.type) || /\.(html?|xhtml)$/i.test(file.name);
}

function validateFiles(action, files) {
  const meta = ACTIONS[action];
  if (!meta) throw new Error(`Unknown action: ${action}`);
  if (files.length < meta.minFiles) throw new Error(`${meta.label} needs at least ${meta.minFiles} file(s).`);
  if (files.length > meta.maxFiles) throw new Error(`${meta.label} supports up to ${meta.maxFiles} file(s).`);

  files.forEach((file) => {
    if (meta.accepts.includes('pdf') && !isPdf(file)) throw new Error(`${file.name}: PDF file required.`);
    if (meta.accepts.includes('image') && !isImage(file)) throw new Error(`${file.name}: PNG or JPG image required.`);
    if (meta.accepts.includes('word') && !isWord(file)) throw new Error(`${file.name}: DOCX file required.`);
    if (meta.accepts.includes('powerpoint') && !isPowerPoint(file)) throw new Error(`${file.name}: PPTX file required.`);
    if (meta.accepts.includes('excel') && !isExcel(file)) throw new Error(`${file.name}: XLSX file required.`);
    if (meta.accepts.includes('html') && !isHtml(file)) throw new Error(`${file.name}: HTML file required.`);
  });
}

function sendDownload(res, fileName, mimeType, buffer, warnings = []) {
  const safeName = cleanBaseName(fileName) + (path.extname(fileName) || '');
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Length', buffer.length);
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
  if (warnings.length) {
    res.setHeader('X-VerifyDocs-Warnings', encodeURIComponent(JSON.stringify(warnings)));
  }
  return res.status(200).send(buffer);
}

function parsePages(value, totalPages) {
  const input = String(value || '').trim();
  if (!input) return Array.from({ length: totalPages }, (_, index) => index);

  const pages = [];
  for (const part of input.split(',')) {
    const token = part.trim();
    if (!token) continue;

    if (token.includes('-')) {
      const [startRaw, endRaw] = token.split('-').map((item) => parseInt(item.trim(), 10));
      if (!Number.isInteger(startRaw) || !Number.isInteger(endRaw)) throw new Error(`Invalid page range: ${token}`);
      const start = Math.min(startRaw, endRaw);
      const end = Math.max(startRaw, endRaw);
      for (let page = start; page <= end; page += 1) pages.push(page - 1);
    } else {
      const page = parseInt(token, 10);
      if (!Number.isInteger(page)) throw new Error(`Invalid page number: ${token}`);
      pages.push(page - 1);
    }
  }

  const unique = [...new Set(pages)];
  if (!unique.length) throw new Error('No pages selected.');
  unique.forEach((page) => {
    if (page < 0 || page >= totalPages) throw new Error(`Page ${page + 1} is outside 1-${totalPages}.`);
  });
  return unique;
}

function parsePageGroups(value, totalPages) {
  const input = String(value || '').trim();
  if (!input) return Array.from({ length: totalPages }, (_, index) => [index]);

  return input
    .split(/[;\n]+/)
    .map((group) => group.trim())
    .filter(Boolean)
    .map((group) => parsePages(group, totalPages));
}

function getScale(options) {
  const scale = Number(options.scale || 1.5);
  if (!Number.isFinite(scale)) return 1.5;
  return Math.min(3, Math.max(0.5, scale));
}

async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return pdfjsPromise;
}

async function loadPdfjsDocument(buffer) {
  const pdfjs = await getPdfjs();
  const task = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    disableWorker: true,
    disableFontFace: true,
    isEvalSupported: false,
    useWorkerFetch: false,
    verbosity: pdfjs.VerbosityLevel?.ERRORS || 0
  });
  return task.promise;
}

async function renderPdfToImages(file, options) {
  const { createCanvas } = require('@napi-rs/canvas');
  const pdf = await loadPdfjsDocument(file.buffer);

  try {
    const selectedPages = parsePages(options.pages, pdf.numPages).slice(0, MAX_RENDER_PAGES);
    const warnings = [];
    if (parsePages(options.pages, pdf.numPages).length > MAX_RENDER_PAGES) {
      warnings.push(`Rendered only first ${MAX_RENDER_PAGES} selected pages to protect serverless runtime.`);
    }

    const scale = getScale(options);
    const outputs = [];

    for (const pageIndex of selectedPages) {
      const page = await pdf.getPage(pageIndex + 1);
      const viewport = page.getViewport({ scale });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const context = canvas.getContext('2d');
      await page.render({ canvasContext: context, viewport }).promise;

      let buffer;
      if (typeof canvas.toBuffer === 'function') {
        buffer = canvas.toBuffer('image/png');
      } else if (typeof canvas.encode === 'function') {
        buffer = Buffer.from(await canvas.encode('png'));
      } else {
        throw new Error('Canvas encoder is unavailable.');
      }

      outputs.push({
        fileName: `${file.base}-page-${pageIndex + 1}.png`,
        mimeType: 'image/png',
        buffer
      });
      page.cleanup?.();
    }

    return { outputs, warnings };
  } finally {
    await pdf.destroy?.();
  }
}

async function imagesToPdf(files) {
  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const image = /\.png$/i.test(file.name) || /^image\/png$/i.test(file.type)
      ? await pdfDoc.embedPng(pdfLibBytes(file.buffer))
      : await pdfDoc.embedJpg(pdfLibBytes(file.buffer));

    const page = pdfDoc.addPage(A4);
    const [pageWidth, pageHeight] = A4;
    const margin = 36;
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;
    const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
    const width = image.width * ratio;
    const height = image.height * ratio;

    page.drawImage(image, {
      x: (pageWidth - width) / 2,
      y: (pageHeight - height) / 2,
      width,
      height
    });
  }

  return Buffer.from(await pdfDoc.save({ useObjectStreams: true }));
}

async function mergePdfs(files) {
  const output = await PDFDocument.create();
  for (const file of files) {
    const input = await PDFDocument.load(pdfLibBytes(file.buffer));
    const copiedPages = await output.copyPages(input, input.getPageIndices());
    copiedPages.forEach((page) => output.addPage(page));
  }
  return Buffer.from(await output.save({ useObjectStreams: true }));
}

async function splitPdf(file, options) {
  const input = await PDFDocument.load(pdfLibBytes(file.buffer));
  const groups = parsePageGroups(options.pages, input.getPageCount());
  const outputs = [];

  for (let index = 0; index < groups.length; index += 1) {
    const output = await PDFDocument.create();
    const pages = await output.copyPages(input, groups[index]);
    pages.forEach((page) => output.addPage(page));
    outputs.push({
      fileName: groups.length === 1 ? `${file.base}-split.pdf` : `${file.base}-part-${index + 1}.pdf`,
      mimeType: 'application/pdf',
      buffer: Buffer.from(await output.save({ useObjectStreams: true }))
    });
  }

  return outputs;
}

async function compressPdf(file) {
  const input = await PDFDocument.load(pdfLibBytes(file.buffer), { ignoreEncryption: true });
  const output = Buffer.from(await input.save({ useObjectStreams: true, objectsPerTick: 50 }));
  const warnings = [];

  if (output.length >= file.buffer.length) {
    warnings.push('Lossless PDF rebuild did not reduce size; original PDF returned because it was already compact.');
    return { buffer: file.buffer, warnings };
  }

  return { buffer: output, warnings };
}

async function rotatePdf(file, options) {
  const input = await PDFDocument.load(pdfLibBytes(file.buffer));
  const selectedPages = parsePages(options.pages, input.getPageCount());
  const amount = Number.isFinite(Number(options.rotation)) ? Number(options.rotation) : 90;
  const normalized = ((Math.round(amount / 90) * 90) % 360 + 360) % 360;

  input.getPages().forEach((page, index) => {
    if (!selectedPages.includes(index)) return;
    const current = page.getRotation().angle || 0;
    page.setRotation(degrees((current + normalized) % 360));
  });

  return Buffer.from(await input.save({ useObjectStreams: true }));
}

async function lockPdf(file, options) {
  const password = String(options.password || '').trim();
  if (!password) throw new Error('Password is required to lock a PDF.');
  const { encryptPDF } = await import('@pdfsmaller/pdf-encrypt-lite');
  const encrypted = await encryptPDF(new Uint8Array(file.buffer), password, options.ownerPassword || password);
  return Buffer.from(encrypted);
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true });
    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr.trim() || `${command} exited with code ${code}`));
    });
  });
}

async function unlockPdf(file, options) {
  const password = String(options.password || '').trim();
  if (!password) throw new Error('Password is required to unlock a PDF.');

  try {
    const plain = await PDFDocument.load(pdfLibBytes(file.buffer));
    return {
      buffer: Buffer.from(await plain.save({ useObjectStreams: true })),
      warnings: ['PDF was not encrypted; rebuilt and returned a clean copy.']
    };
  } catch (_) {
    // Encrypted PDFs need a decryption engine. qpdf is optional so self-hosted installs can enable it.
  }

  const qpdf = process.env.QPDF_BINARY || 'qpdf';
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-tools-'));
  const inputPath = path.join(tempDir, 'locked.pdf');
  const outputPath = path.join(tempDir, 'unlocked.pdf');

  try {
    await fs.writeFile(inputPath, file.buffer);
    await runCommand(qpdf, [`--password=${password}`, '--decrypt', inputPath, outputPath]);
    return { buffer: await fs.readFile(outputPath), warnings: [] };
  } catch (error) {
    throw new Error(`Unlock PDF requires qpdf on the server. Set QPDF_BINARY or install qpdf. Details: ${error.message}`);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function addWatermark(file, options) {
  const text = toWinAnsiSafe(String(options.watermarkText || options.text || 'VERIFYDOCS'));
  const input = await PDFDocument.load(pdfLibBytes(file.buffer));
  const font = await input.embedFont(StandardFonts.HelveticaBold);
  const selectedPages = parsePages(options.pages, input.getPageCount());
  const opacity = Math.min(0.75, Math.max(0.05, Number(options.opacity || 0.18)));

  input.getPages().forEach((page, index) => {
    if (!selectedPages.includes(index)) return;
    const { width, height } = page.getSize();
    const size = Math.min(width, height) / 9;
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: width / 2 - textWidth / 2,
      y: height / 2,
      size,
      font,
      color: rgb(0, 0.32, 0.64),
      opacity,
      rotate: degrees(-35)
    });
  });

  return Buffer.from(await input.save({ useObjectStreams: true }));
}

function optionColor(value) {
  const colors = {
    black: rgb(0.05, 0.09, 0.16),
    blue: rgb(0, 0.32, 0.8),
    green: rgb(0.07, 0.53, 0.25),
    red: rgb(0.78, 0.12, 0.12),
    gray: rgb(0.39, 0.45, 0.55)
  };
  return colors[String(value || '').toLowerCase()] || colors.black;
}

async function editPdf(file, options) {
  const text = toWinAnsiSafe(String(options.editText || options.text || '').trim());
  if (!text) throw new Error('Text is required to edit a PDF.');

  const input = await PDFDocument.load(pdfLibBytes(file.buffer));
  const font = await input.embedFont(options.bold === 'yes' ? StandardFonts.HelveticaBold : StandardFonts.Helvetica);
  const selectedPages = parsePages(options.pages, input.getPageCount());
  const size = Math.min(72, Math.max(8, Number(options.fontSize || 16)));
  const xPercent = Math.min(95, Math.max(0, Number(options.x || 8)));
  const yPercent = Math.min(95, Math.max(0, Number(options.y || 12)));
  const color = optionColor(options.color);
  const opacity = Math.min(1, Math.max(0.1, Number(options.opacity || 1)));

  input.getPages().forEach((page, index) => {
    if (!selectedPages.includes(index)) return;

    const { width, height } = page.getSize();
    const x = (xPercent / 100) * width;
    let y = height - ((yPercent / 100) * height);
    const maxWidth = Math.max(48, width - x - 36);
    const lineHeight = size * 1.25;
    const lines = text.split(/\n+/).flatMap((line) => wrapText(line, font, size, maxWidth));

    lines.forEach((line) => {
      if (y < 24) return;
      page.drawText(line, {
        x,
        y,
        size,
        font,
        color,
        opacity
      });
      y -= lineHeight;
    });
  });

  return Buffer.from(await input.save({ useObjectStreams: true }));
}

function extractJpegImages(file) {
  const binary = file.buffer.toString('latin1');
  const outputs = [];
  let searchAt = 0;

  while (true) {
    const streamIndex = binary.indexOf('stream', searchAt);
    if (streamIndex === -1) break;

    const dictStart = binary.lastIndexOf('<<', streamIndex);
    const dictEnd = binary.lastIndexOf('>>', streamIndex);
    if (dictStart !== -1 && dictEnd !== -1 && dictEnd > dictStart) {
      const dictionary = binary.slice(dictStart, dictEnd + 2);
      const isImageObject = /\/Subtype\s*\/Image/.test(dictionary);
      const isJpeg = /\/Filter\s*(?:\/DCTDecode|\[[^\]]*\/DCTDecode[^\]]*\])/.test(dictionary);
      const isJpx = /\/Filter\s*(?:\/JPXDecode|\[[^\]]*\/JPXDecode[^\]]*\])/.test(dictionary);

      if (isImageObject && (isJpeg || isJpx)) {
        let dataStart = streamIndex + 'stream'.length;
        if (binary[dataStart] === '\r' && binary[dataStart + 1] === '\n') dataStart += 2;
        else if (binary[dataStart] === '\n' || binary[dataStart] === '\r') dataStart += 1;

        const dataEnd = binary.indexOf('endstream', dataStart);
        if (dataEnd !== -1) {
          const buffer = file.buffer.subarray(dataStart, dataEnd);
          if (buffer.length > 100) {
            const extension = isJpx ? 'jp2' : 'jpg';
            outputs.push({
              fileName: `${file.base}-image-${outputs.length + 1}.${extension}`,
              mimeType: isJpx ? 'image/jp2' : 'image/jpeg',
              buffer
            });
          }
          searchAt = dataEnd + 'endstream'.length;
          continue;
        }
      }
    }

    searchAt = streamIndex + 'stream'.length;
  }

  return outputs;
}

async function extractText(file, options = {}) {
  const pdf = await loadPdfjsDocument(file.buffer);
  const lines = [];

  try {
    const selectedPages = parsePages(options.pages, pdf.numPages);
    for (const pageIndex of selectedPages) {
      const page = await pdf.getPage(pageIndex + 1);
      const content = await page.getTextContent();
      const text = content.items.map((item) => item.str).join(' ').replace(/\s+/g, ' ').trim();
      lines.push(`Page ${pageIndex + 1}`);
      lines.push('-'.repeat(16));
      lines.push(text || '[No selectable text found on this page]');
      lines.push('');
      page.cleanup?.();
    }
  } finally {
    await pdf.destroy?.();
  }

  return lines.join('\n');
}

function toWinAnsiSafe(text) {
  return String(text || '').replace(/[^\u0009\u000a\u000d\u0020-\u007e\u00a0-\u00ff]/g, '?');
}

function wrapText(line, font, size, maxWidth) {
  const words = String(line || '').split(/\s+/).filter(Boolean);
  if (!words.length) return [''];

  const lines = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      current = test;
      continue;
    }

    if (current) lines.push(current);
    if (font.widthOfTextAtSize(word, size) <= maxWidth) {
      current = word;
      continue;
    }

    let fragment = '';
    for (const char of word) {
      const testFragment = fragment + char;
      if (font.widthOfTextAtSize(testFragment, size) <= maxWidth) {
        fragment = testFragment;
      } else {
        if (fragment) lines.push(fragment);
        fragment = char;
      }
    }
    current = fragment;
  }

  if (current) lines.push(current);
  return lines;
}

async function createTextPdf(text, title = 'Converted document') {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const margin = 48;
  const fontSize = 11;
  const lineHeight = 16;
  const safeText = toWinAnsiSafe(text);

  let page = pdfDoc.addPage(A4);
  let y = A4[1] - margin;

  page.drawText(toWinAnsiSafe(title).slice(0, 90), {
    x: margin,
    y,
    size: 18,
    font: bold,
    color: rgb(0.05, 0.09, 0.16)
  });
  y -= 34;

  const addPageIfNeeded = () => {
    if (y > margin) return;
    page = pdfDoc.addPage(A4);
    y = A4[1] - margin;
  };

  for (const paragraph of safeText.split(/\n+/)) {
    const wrapped = wrapText(paragraph, font, fontSize, A4[0] - margin * 2);
    for (const line of wrapped) {
      addPageIfNeeded();
      page.drawText(line, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0.12, 0.16, 0.22)
      });
      y -= lineHeight;
    }
    y -= 6;
  }

  return Buffer.from(await pdfDoc.save({ useObjectStreams: true }));
}

async function pdfToWord(file, options) {
  const text = await extractText(file, options);
  const children = [
    new Paragraph({
      children: [new TextRun({ text: `${file.base} - PDF text export`, bold: true, size: 32 })],
      spacing: { after: 320 }
    })
  ];

  text.split(/\n/).forEach((line) => {
    children.push(new Paragraph({
      children: [new TextRun({ text: line || ' ' })],
      spacing: { after: line ? 120 : 60 }
    }));
  });

  const doc = new Document({ sections: [{ properties: {}, children }] });
  return Packer.toBuffer(doc);
}

async function wordToPdf(file) {
  const result = await mammoth.extractRawText({ buffer: file.buffer });
  const text = result.value || 'No text found in this DOCX file.';
  const buffer = await createTextPdf(text, `${file.base} - Word to PDF`);
  const warnings = result.messages?.length
    ? result.messages.map((message) => message.message || String(message))
    : [];

  if (/[^\u0009\u000a\u000d\u0020-\u007e\u00a0-\u00ff]/.test(text)) {
    warnings.push('Some non-Latin characters were replaced because the serverless PDF font supports WinAnsi text only.');
  }

  return { buffer, warnings };
}

function xmlUnescape(input = '') {
  return String(input)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function xmlEscape(input = '') {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function extractXmlTexts(xml = '') {
  const out = [];
  const re = /<a:t[^>]*>([\s\S]*?)<\/a:t>|<t[^>]*>([\s\S]*?)<\/t>/g;
  let match;
  while ((match = re.exec(xml))) {
    const value = xmlUnescape(match[1] || match[2] || '').trim();
    if (value) out.push(value);
  }
  return out;
}

async function extractTextFromPptx(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const slideNames = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => {
      const an = Number((a.match(/slide(\d+)\.xml/i) || [])[1] || 0);
      const bn = Number((b.match(/slide(\d+)\.xml/i) || [])[1] || 0);
      return an - bn;
    });

  const chunks = [];
  for (const slide of slideNames) {
    const xml = await zip.file(slide).async('string');
    const lines = extractXmlTexts(xml);
    chunks.push(lines.join(' ').replace(/\s+/g, ' ').trim());
  }

  return chunks
    .map((text, idx) => `Slide ${idx + 1}\n----------------\n${text || '[No text found]'}\n`)
    .join('\n')
    .trim();
}

async function extractTextFromXlsx(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const sharedStringsXml = zip.file('xl/sharedStrings.xml');
  const workbookXml = zip.file('xl/workbook.xml');
  const sheetNames = Object.keys(zip.files).filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(name)).sort();
  const sharedStrings = [];

  if (sharedStringsXml) {
    const xml = await sharedStringsXml.async('string');
    sharedStrings.push(...extractXmlTexts(xml));
  }

  let workbookTitle = 'Workbook';
  if (workbookXml) {
    const xml = await workbookXml.async('string');
    const names = [...xml.matchAll(/<sheet[^>]*name="([^"]+)"/g)].map((m) => xmlUnescape(m[1]));
    if (names.length) workbookTitle = `Workbook: ${names.join(', ')}`;
  }

  const values = [];
  for (const sheet of sheetNames) {
    const xml = await zip.file(sheet).async('string');
    const cellMatches = [...xml.matchAll(/<c[^>]*>([\s\S]*?)<\/c>/g)];
    const lines = [];
    for (const cell of cellMatches) {
      const raw = cell[1] || '';
      const sharedIdx = raw.match(/<v>(\d+)<\/v>/);
      const inline = raw.match(/<is>[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>[\s\S]*?<\/is>/);
      let value = '';
      if (sharedIdx) value = sharedStrings[Number(sharedIdx[1])] || '';
      else if (inline) value = xmlUnescape(inline[1]);
      else {
        const direct = raw.match(/<v>([\s\S]*?)<\/v>/);
        value = direct ? xmlUnescape(direct[1]) : '';
      }
      value = String(value).trim();
      if (value) lines.push(value);
    }
    if (lines.length) values.push(lines.join(' | '));
  }

  return `${workbookTitle}\n\n${values.join('\n')}`.trim() || 'No extractable text found in workbook.';
}

async function makeSimpleXlsx(rows, sheetName = 'PDF Text') {
  const zip = new JSZip();
  const safeRows = rows.length ? rows : [['No extractable text found']];
  const colName = (index) => {
    let n = index + 1;
    let out = '';
    while (n > 0) {
      const rem = (n - 1) % 26;
      out = String.fromCharCode(65 + rem) + out;
      n = Math.floor((n - 1) / 26);
    }
    return out;
  };
  const sheetData = safeRows.map((row, rowIndex) => {
    const cells = row.map((value, colIndex) => {
      const ref = `${colName(colIndex)}${rowIndex + 1}`;
      return `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`;
    }).join('');
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join('');

  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`);
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`);
  zip.file('docProps/core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>VerifyDocs</dc:creator>
  <dc:title>${xmlEscape(sheetName)}</dc:title>
  <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
</cp:coreProperties>`);
  zip.file('docProps/app.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>VerifyDocs</Application></Properties>`);
  zip.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="${xmlEscape(sheetName).slice(0, 31)}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`);
  zip.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);
  zip.file('xl/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="1"><xf/></cellXfs></styleSheet>`);
  zip.file('xl/worksheets/sheet1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${sheetData}</sheetData>
</worksheet>`);

  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

async function pdfToPowerPoint(file, options) {
  const { outputs, warnings } = await renderPdfToImages(file, { ...options, scale: options.scale || 1 });
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'VerifyDocs';
  pptx.subject = 'PDF to PowerPoint export';
  pptx.title = file.base;
  pptx.company = 'VerifyDocs';
  pptx.lang = 'en-IN';
  pptx.defineLayout({ name: 'VERIFYDOCS_WIDE', width: 13.333, height: 7.5 });
  pptx.layout = 'VERIFYDOCS_WIDE';

  outputs.forEach((output, index) => {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    slide.addImage({
      data: `data:image/png;base64,${output.buffer.toString('base64')}`,
      x: 0,
      y: 0,
      w: 13.333,
      h: 7.5,
      sizing: { type: 'contain', x: 0, y: 0, w: 13.333, h: 7.5 }
    });
    slide.addNotes(`Page ${index + 1} exported from ${file.name}`);
  });

  const data = await pptx.write({ outputType: 'nodebuffer' });
  return { buffer: Buffer.from(data), warnings };
}

async function pdfToExcel(file, options) {
  const text = await extractText(file, options);
  const rows = [['Page', 'Text']];
  let currentPage = '';
  text.split(/\n+/).forEach((line) => {
    const clean = line.trim();
    if (!clean || /^-+$/.test(clean)) return;
    if (/^Page \d+$/i.test(clean)) {
      currentPage = clean;
      return;
    }
    rows.push([currentPage || 'Document', clean]);
  });
  return makeSimpleXlsx(rows, 'PDF Text');
}

function stripHtmlToText(html = '') {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function organizePdf(file, options) {
  const input = await PDFDocument.load(pdfLibBytes(file.buffer));
  const order = parsePages(options.pages, input.getPageCount());
  const out = await PDFDocument.create();
  const pages = await out.copyPages(input, order);
  pages.forEach((page) => out.addPage(page));
  return Buffer.from(await out.save({ useObjectStreams: true }));
}

async function pageNumbersPdf(file, options) {
  const input = await PDFDocument.load(pdfLibBytes(file.buffer));
  const font = await input.embedFont(StandardFonts.Helvetica);
  const pages = input.getPages();
  const selectedPages = parsePages(options.pages, pages.length);
  const size = Math.min(36, Math.max(8, Number(options.fontSize || 12)));
  const position = String(options.position || 'bottom-center');
  const color = optionColor(options.color || 'gray');
  const prefix = toWinAnsiSafe(String(options.prefix || '').trim());

  pages.forEach((page, index) => {
    if (!selectedPages.includes(index)) return;
    const { width, height } = page.getSize();
    const label = `${prefix}${index + 1}/${pages.length}`;
    const textWidth = font.widthOfTextAtSize(label, size);
    let x = (width - textWidth) / 2;
    let y = 18;
    if (position === 'top-left') { x = 18; y = height - size - 12; }
    if (position === 'top-right') { x = width - textWidth - 18; y = height - size - 12; }
    if (position === 'bottom-left') { x = 18; y = 18; }
    if (position === 'bottom-right') { x = width - textWidth - 18; y = 18; }
    if (position === 'top-center') { x = (width - textWidth) / 2; y = height - size - 12; }
    page.drawText(label, { x, y, size, font, color, opacity: 0.95 });
  });

  return Buffer.from(await input.save({ useObjectStreams: true }));
}

async function repairPdf(file) {
  const input = await PDFDocument.load(pdfLibBytes(file.buffer), { ignoreEncryption: true });
  return Buffer.from(await input.save({ useObjectStreams: true, updateFieldAppearances: false }));
}

async function redactPdf(file, options) {
  const input = await PDFDocument.load(pdfLibBytes(file.buffer));
  const selectedPages = parsePages(options.pages, input.getPageCount());
  const x = Math.min(95, Math.max(0, Number(options.x || 10)));
  const y = Math.min(95, Math.max(0, Number(options.y || 10)));
  const w = Math.min(100, Math.max(1, Number(options.width || 40)));
  const h = Math.min(100, Math.max(1, Number(options.height || 10)));

  input.getPages().forEach((page, index) => {
    if (!selectedPages.includes(index)) return;
    const box = page.getSize();
    const rx = (x / 100) * box.width;
    const rh = (h / 100) * box.height;
    const ryTop = (y / 100) * box.height;
    const ry = Math.max(0, box.height - ryTop - rh);
    const rw = Math.min(box.width - rx, (w / 100) * box.width);
    page.drawRectangle({ x: rx, y: ry, width: rw, height: rh, color: rgb(0, 0, 0), opacity: 1 });
  });

  return Buffer.from(await input.save({ useObjectStreams: true }));
}

async function cropPdf(file, options) {
  const input = await PDFDocument.load(pdfLibBytes(file.buffer));
  const selectedPages = parsePages(options.pages, input.getPageCount());
  const marginPct = Math.min(40, Math.max(0, Number(options.margin || 5)));
  input.getPages().forEach((page, index) => {
    if (!selectedPages.includes(index)) return;
    const { width, height } = page.getSize();
    const mx = (marginPct / 100) * width;
    const my = (marginPct / 100) * height;
    const newWidth = Math.max(36, width - mx * 2);
    const newHeight = Math.max(36, height - my * 2);
    page.setCropBox(mx, my, newWidth, newHeight);
  });
  return Buffer.from(await input.save({ useObjectStreams: true }));
}

function summarizeText(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return 'No text could be extracted from this PDF.';
  const sentences = clean.split(/(?<=[.?!])\s+/).filter(Boolean);
  const first = sentences.slice(0, 6);
  const key = [...new Set(clean.toLowerCase().match(/\b[a-z]{5,}\b/g) || [])]
    .slice(0, 15)
    .join(', ');
  return [
    'Summary',
    '-------',
    first.join(' '),
    '',
    `Key terms: ${key || 'N/A'}`
  ].join('\n');
}

function translateLite(text, targetLang) {
  const lang = String(targetLang || 'hi').toLowerCase();
  const mapEnHi = {
    document: 'दस्तावेज',
    validation: 'सत्यापन',
    number: 'नंबर',
    page: 'पेज',
    name: 'नाम',
    date: 'तारीख',
    total: 'कुल',
    amount: 'राशि',
    signature: 'हस्ताक्षर'
  };
  if (lang !== 'hi') return text;
  let out = String(text || '');
  Object.entries(mapEnHi).forEach(([en, hi]) => {
    const re = new RegExp(`\\b${en}\\b`, 'gi');
    out = out.replace(re, hi);
  });
  return out;
}

async function zipOutputs(outputs, zipName) {
  const zip = new JSZip();
  outputs.forEach((output) => zip.file(output.fileName, output.buffer));
  return {
    fileName: zipName,
    mimeType: 'application/zip',
    buffer: await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  };
}

async function handleAction(action, files, options) {
  switch (action) {
    case 'pdf-to-image': {
      const { outputs, warnings } = await renderPdfToImages(files[0], options);
      if (outputs.length === 1) return { kind: 'one', ...outputs[0], warnings };
      const zipped = await zipOutputs(outputs, `${files[0].base}-images.zip`);
      return { kind: 'one', ...zipped, warnings };
    }

    case 'image-to-pdf':
      return { kind: 'one', fileName: 'images-to-pdf.pdf', mimeType: 'application/pdf', buffer: await imagesToPdf(files), warnings: [] };

    case 'merge-pdf':
      return { kind: 'one', fileName: 'merged.pdf', mimeType: 'application/pdf', buffer: await mergePdfs(files), warnings: [] };

    case 'split-pdf': {
      const outputs = await splitPdf(files[0], options);
      if (outputs.length === 1) return { kind: 'one', ...outputs[0], warnings: [] };
      const zipped = await zipOutputs(outputs, `${files[0].base}-split.zip`);
      return { kind: 'one', ...zipped, warnings: [] };
    }

    case 'compress-pdf': {
      const { buffer, warnings } = await compressPdf(files[0]);
      return { kind: 'one', fileName: `${files[0].base}-compressed.pdf`, mimeType: 'application/pdf', buffer, warnings };
    }

    case 'rotate-pdf':
      return { kind: 'one', fileName: `${files[0].base}-rotated.pdf`, mimeType: 'application/pdf', buffer: await rotatePdf(files[0], options), warnings: [] };

    case 'edit-pdf':
      return { kind: 'one', fileName: `${files[0].base}-edited.pdf`, mimeType: 'application/pdf', buffer: await editPdf(files[0], options), warnings: [] };

    case 'lock-pdf':
      return { kind: 'one', fileName: `${files[0].base}-locked.pdf`, mimeType: 'application/pdf', buffer: await lockPdf(files[0], options), warnings: [] };

    case 'unlock-pdf': {
      const { buffer, warnings } = await unlockPdf(files[0], options);
      return { kind: 'one', fileName: `${files[0].base}-unlocked.pdf`, mimeType: 'application/pdf', buffer, warnings };
    }

    case 'add-watermark':
      return { kind: 'one', fileName: `${files[0].base}-watermarked.pdf`, mimeType: 'application/pdf', buffer: await addWatermark(files[0], options), warnings: [] };

    case 'extract-images': {
      const outputs = extractJpegImages(files[0]);
      if (!outputs.length) {
        throw new Error('No directly embedded JPEG/JPX images found. Scanned PDFs or Flate-compressed images may need a native extractor.');
      }
      const zipped = await zipOutputs(outputs, `${files[0].base}-images.zip`);
      return { kind: 'one', ...zipped, warnings: [] };
    }

    case 'extract-text': {
      const text = await extractText(files[0], options);
      return { kind: 'one', fileName: `${files[0].base}-text.txt`, mimeType: 'text/plain', buffer: Buffer.from(text, 'utf8'), warnings: [] };
    }

    case 'pdf-to-word':
      return { kind: 'one', fileName: `${files[0].base}.docx`, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: await pdfToWord(files[0], options), warnings: ['PDF to Word exports selectable text and basic page labels; exact layout reconstruction is not available in this serverless mode.'] };

    case 'word-to-pdf': {
      const { buffer, warnings } = await wordToPdf(files[0]);
      return { kind: 'one', fileName: `${files[0].base}.pdf`, mimeType: 'application/pdf', buffer, warnings };
    }

    case 'pdf-to-powerpoint': {
      const { buffer, warnings } = await pdfToPowerPoint(files[0], options);
      return { kind: 'one', fileName: `${files[0].base}.pptx`, mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', buffer, warnings };
    }

    case 'pdf-to-excel': {
      return { kind: 'one', fileName: `${files[0].base}.xlsx`, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: await pdfToExcel(files[0], options), warnings: ['Exported selectable PDF text into spreadsheet rows. Scanned image-only PDFs need OCR first.'] };
    }

    case 'powerpoint-to-pdf': {
      const text = await extractTextFromPptx(files[0].buffer);
      const buffer = await createTextPdf(text || 'No extractable text found in PPTX.', `${files[0].base} - PowerPoint to PDF`);
      return { kind: 'one', fileName: `${files[0].base}.pdf`, mimeType: 'application/pdf', buffer, warnings: ['Converted PPTX text content into PDF. Complex slide design is not preserved in serverless mode.'] };
    }

    case 'excel-to-pdf': {
      const text = await extractTextFromXlsx(files[0].buffer);
      const buffer = await createTextPdf(text || 'No extractable text found in XLSX.', `${files[0].base} - Excel to PDF`);
      return { kind: 'one', fileName: `${files[0].base}.pdf`, mimeType: 'application/pdf', buffer, warnings: ['Converted XLSX text values into PDF. Cell styling/formulas are not preserved in serverless mode.'] };
    }

    case 'sign-pdf': {
      const signature = toWinAnsiSafe(String(options.signature || options.signText || 'Digitally signed'));
      const signed = await editPdf(files[0], {
        editText: signature,
        pages: options.pages || '',
        x: options.x || 65,
        y: options.y || 90,
        fontSize: options.fontSize || 16,
        color: options.color || 'blue',
        bold: 'yes'
      });
      return { kind: 'one', fileName: `${files[0].base}-signed.pdf`, mimeType: 'application/pdf', buffer: signed, warnings: ['This is a visual signature stamp, not a cryptographic digital certificate signature.'] };
    }

    case 'html-to-pdf': {
      const raw = files[0].buffer.toString('utf8');
      const text = stripHtmlToText(raw);
      const buffer = await createTextPdf(text || 'No readable text found in HTML.', `${files[0].base} - HTML to PDF`);
      return { kind: 'one', fileName: `${files[0].base}.pdf`, mimeType: 'application/pdf', buffer, warnings: ['HTML was converted as text content in serverless mode. Pixel-perfect webpage rendering is not available in this runtime.'] };
    }

    case 'organize-pdf':
      return { kind: 'one', fileName: `${files[0].base}-organized.pdf`, mimeType: 'application/pdf', buffer: await organizePdf(files[0], options), warnings: [] };

    case 'pdf-to-pdfa': {
      const buffer = await repairPdf(files[0]);
      return { kind: 'one', fileName: `${files[0].base}-pdfa-ready.pdf`, mimeType: 'application/pdf', buffer, warnings: ['Output is rebuilt for archival-friendly structure but not formally certified against every PDF/A conformance rule.'] };
    }

    case 'repair-pdf':
      return { kind: 'one', fileName: `${files[0].base}-repaired.pdf`, mimeType: 'application/pdf', buffer: await repairPdf(files[0]), warnings: [] };

    case 'page-numbers':
      return { kind: 'one', fileName: `${files[0].base}-numbered.pdf`, mimeType: 'application/pdf', buffer: await pageNumbersPdf(files[0], options), warnings: [] };

    case 'scan-to-pdf':
      return { kind: 'one', fileName: 'scans-to-pdf.pdf', mimeType: 'application/pdf', buffer: await imagesToPdf(files), warnings: [] };

    case 'ocr-pdf': {
      const text = await extractText(files[0], options);
      const buffer = await createTextPdf(text || 'No selectable text found for OCR export.', `${files[0].base} - OCR Text Export`);
      return { kind: 'one', fileName: `${files[0].base}-ocr-text.pdf`, mimeType: 'application/pdf', buffer, warnings: ['Serverless OCR mode exports extracted text into a readable PDF. Scanned-image OCR accuracy depends on source text layer availability.'] };
    }

    case 'compare-pdf': {
      const left = await extractText(files[0], options);
      const right = await extractText(files[1], options);
      const leftLines = left.split(/\n+/).map((l) => l.trim()).filter(Boolean);
      const rightLines = right.split(/\n+/).map((l) => l.trim()).filter(Boolean);
      const onlyLeft = leftLines.filter((line) => !rightLines.includes(line)).slice(0, 200);
      const onlyRight = rightLines.filter((line) => !leftLines.includes(line)).slice(0, 200);
      const report = [
        `Compare report: ${files[0].name} vs ${files[1].name}`,
        '',
        `Unique lines in ${files[0].name}: ${onlyLeft.length}`,
        ...onlyLeft.map((line) => `- ${line}`),
        '',
        `Unique lines in ${files[1].name}: ${onlyRight.length}`,
        ...onlyRight.map((line) => `- ${line}`)
      ].join('\n');
      return { kind: 'one', fileName: 'pdf-compare-report.txt', mimeType: 'text/plain', buffer: Buffer.from(report, 'utf8'), warnings: ['Comparison is text-based and does not include visual layout diffing.'] };
    }

    case 'redact-pdf':
      return { kind: 'one', fileName: `${files[0].base}-redacted.pdf`, mimeType: 'application/pdf', buffer: await redactPdf(files[0], options), warnings: ['Applied rectangle redaction overlay. Validate the final document before sharing sensitive data.'] };

    case 'crop-pdf':
      return { kind: 'one', fileName: `${files[0].base}-cropped.pdf`, mimeType: 'application/pdf', buffer: await cropPdf(files[0], options), warnings: [] };

    case 'ai-summarizer': {
      const text = await extractText(files[0], options);
      const summary = summarizeText(text);
      return { kind: 'one', fileName: `${files[0].base}-summary.txt`, mimeType: 'text/plain', buffer: Buffer.from(summary, 'utf8'), warnings: ['Summary is generated with local heuristic logic in serverless mode.'] };
    }

    case 'translate-pdf': {
      const text = await extractText(files[0], options);
      const translated = translateLite(text, options.targetLang || 'hi');
      return { kind: 'one', fileName: `${files[0].base}-translated.txt`, mimeType: 'text/plain', buffer: Buffer.from(translated, 'utf8'), warnings: ['Translation uses local lightweight dictionary rules and is best for quick readability, not certified translation.'] };
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

async function handler(req, res) {
  setHeaders(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'GET') return res.status(200).json({ success: true, actions: ACTIONS, limits: { maxFileBytes: MAX_FILE_BYTES, maxRenderPages: MAX_RENDER_PAGES } });
  if (req.method !== 'POST') return apiError(res, 405, 'Method not allowed');

  try {
    const { action, files: rawFiles, options = {} } = req.body || {};
    const files = decodeFiles(rawFiles);
    validateFiles(action, files);

    const result = await handleAction(action, files, options);
    if (result.kind === 'many') return sendMany(res, result.files, result.warnings);
    if (String(req.headers?.['x-verifydocs-download'] || '').toLowerCase() === 'binary') {
      return sendDownload(res, result.fileName, result.mimeType, result.buffer, result.warnings);
    }
    return sendOne(res, result.fileName, result.mimeType, result.buffer, result.warnings);
  } catch (error) {
    const message = error.message || 'PDF tool failed';
    const status = /too large|required|invalid|outside|unknown|needs at least|supports up to|No .*found|requires qpdf/i.test(message) ? 400 : 500;
    return apiError(res, status, message);
  }
}

module.exports = handler;
module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '32mb'
    }
  }
};
