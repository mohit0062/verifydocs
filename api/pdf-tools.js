const { spawn } = require('child_process');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const JSZip = require('jszip');
const mammoth = require('mammoth');
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
  'word-to-pdf': { label: 'Word to PDF', minFiles: 1, maxFiles: 1, accepts: ['word'] }
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

function validateFiles(action, files) {
  const meta = ACTIONS[action];
  if (!meta) throw new Error(`Unknown action: ${action}`);
  if (files.length < meta.minFiles) throw new Error(`${meta.label} needs at least ${meta.minFiles} file(s).`);
  if (files.length > meta.maxFiles) throw new Error(`${meta.label} supports up to ${meta.maxFiles} file(s).`);

  files.forEach((file) => {
    if (meta.accepts.includes('pdf') && !isPdf(file)) throw new Error(`${file.name}: PDF file required.`);
    if (meta.accepts.includes('image') && !isImage(file)) throw new Error(`${file.name}: PNG or JPG image required.`);
    if (meta.accepts.includes('word') && !isWord(file)) throw new Error(`${file.name}: DOCX file required.`);
  });
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
      sizeLimit: '12mb'
    }
  }
};
