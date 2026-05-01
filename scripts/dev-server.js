const http = require('http');
const fs = require('fs/promises');
const path = require('path');
const pdfToolsHandler = require('../api/pdf-tools');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 3000);
const MAX_BODY_BYTES = 12 * 1024 * 1024;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.txt': 'text/plain; charset=utf-8'
};

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, headers);
  res.end(body);
}

async function readJsonBody(req) {
  const chunks = [];
  let total = 0;

  for await (const chunk of req) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) throw new Error('Request body too large');
    chunks.push(chunk);
  }

  const body = Buffer.concat(chunks).toString('utf8');
  return body ? JSON.parse(body) : {};
}

function apiResponseAdapter(res) {
  return {
    statusCode: 200,
    headers: {},
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      send(res, this.statusCode, JSON.stringify(payload), {
        'Content-Type': 'application/json; charset=utf-8',
        ...this.headers
      });
      return this;
    },
    end(body = '') {
      send(res, this.statusCode, body, this.headers);
      return this;
    }
  };
}

function safeStaticPath(urlPath) {
  let pathname = decodeURIComponent(urlPath.split('?')[0]);
  if (pathname === '/') pathname = '/index.html';
  if (!path.extname(pathname)) pathname = `${pathname}.html`;

  const fullPath = path.resolve(ROOT, `.${pathname}`);
  if (!fullPath.startsWith(ROOT)) return null;
  return fullPath;
}

async function serveStatic(req, res) {
  const fullPath = safeStaticPath(req.url);
  if (!fullPath) return send(res, 403, 'Forbidden', { 'Content-Type': 'text/plain; charset=utf-8' });

  try {
    const body = await fs.readFile(fullPath);
    const type = MIME_TYPES[path.extname(fullPath).toLowerCase()] || 'application/octet-stream';
    return send(res, 200, body, { 'Content-Type': type });
  } catch (_) {
    return send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (parsedUrl.pathname === '/api/pdf-tools') {
      const apiReq = req;
      apiReq.query = Object.fromEntries(parsedUrl.searchParams.entries());
      apiReq.body = req.method === 'POST' ? await readJsonBody(req) : {};
      return pdfToolsHandler(apiReq, apiResponseAdapter(res));
    }

    return serveStatic(req, res);
  } catch (error) {
    return send(res, 500, JSON.stringify({ success: false, error: error.message }), {
      'Content-Type': 'application/json; charset=utf-8'
    });
  }
});

server.listen(PORT, () => {
  console.log(`VerifyDocs local server running at http://localhost:${PORT}`);
});
