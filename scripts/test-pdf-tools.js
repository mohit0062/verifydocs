const handler = require('../api/pdf-tools');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const { createCanvas } = require('@napi-rs/canvas');
const { Document, Packer, Paragraph, TextRun } = require('docx');

function mockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    end() {
      return this;
    }
  };
  return res;
}

async function makeSamplePdf(text) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([420, 300]);
  page.drawText(text, { x: 40, y: 150, size: 24, font, color: rgb(0, 0.2, 0.5) });
  return Buffer.from(await pdf.save());
}

async function call(action, files, options = {}) {
  const req = {
    method: 'POST',
    body: {
      action,
      options,
      files: files.map((file) => ({
        name: file.name,
        type: file.type,
        data: file.buffer.toString('base64')
      }))
    }
  };
  const res = mockResponse();
  await handler(req, res);
  if (res.statusCode >= 400) {
    throw new Error(`${action} failed: ${JSON.stringify(res.body)}`);
  }
  console.log(`${action}: ${res.body.file.fileName} (${res.body.file.size} bytes)`);
  return res.body;
}

function fileFromResult(result, name = result.file.fileName) {
  return {
    name,
    type: result.file.mimeType,
    buffer: Buffer.from(result.file.data, 'base64')
  };
}

function makeSampleJpeg() {
  const canvas = createCanvas(64, 64);
  const context = canvas.getContext('2d');
  context.fillStyle = '#0066cc';
  context.fillRect(0, 0, 64, 64);
  context.fillStyle = '#ffffff';
  context.fillRect(18, 18, 28, 28);
  return Buffer.from(canvas.toBuffer('image/jpeg'));
}

async function makeSampleDocx() {
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ children: [new TextRun({ text: 'Sample DOCX', bold: true })] }),
        new Paragraph({ children: [new TextRun({ text: 'This file is used to test Word to PDF.' })] })
      ]
    }]
  });
  return Packer.toBuffer(doc);
}

(async () => {
  const first = { name: 'first.pdf', type: 'application/pdf', buffer: await makeSamplePdf('First PDF') };
  const second = { name: 'second.pdf', type: 'application/pdf', buffer: await makeSamplePdf('Second PDF') };
  const jpeg = { name: 'sample.jpg', type: 'image/jpeg', buffer: makeSampleJpeg() };
  const docx = { name: 'sample.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: await makeSampleDocx() };

  await call('pdf-to-image', [first], { pages: '1', scale: '0.5' });
  const imagePdf = await call('image-to-pdf', [jpeg]);
  await call('merge-pdf', [first, second]);
  await call('split-pdf', [first], { pages: '1' });
  await call('rotate-pdf', [first], { rotation: 90 });
  await call('compress-pdf', [first]);
  await call('edit-pdf', [first], { editText: 'APPROVED', pages: '1', x: '12', y: '20', fontSize: '16', color: 'blue' });
  await call('add-watermark', [first], { watermarkText: 'TEST' });
  await call('lock-pdf', [first], { password: 'secret123' });
  await call('unlock-pdf', [first], { password: 'secret123' });
  await call('extract-images', [fileFromResult(imagePdf, 'image-source.pdf')]);
  await call('extract-text', [first]);
  await call('pdf-to-word', [first]);
  await call('word-to-pdf', [docx]);
})();
