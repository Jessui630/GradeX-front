import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { request as httpsRequest } from 'node:https'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'dist')
const backendOrigin = (process.env.BACKEND_ORIGIN ??
  'https://gradex-api-bxbrgzbvf8bxa6h8.westus-01.azurewebsites.net').replace(/\/+$/, '')
const port = Number(process.env.PORT ?? 8080)

const mime = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.svg', 'image/svg+xml'],
  ['.ico', 'image/x-icon'],
  ['.woff2', 'font/woff2'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
])

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(self), microphone=(), geolocation=()',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; manifest-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
}

function sendJson(response, status, payload) {
  const body = JSON.stringify(payload)
  response.writeHead(status, {
    ...securityHeaders,
    'Content-Type': 'application/problem+json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  })
  response.end(body)
}

function proxy(request, response) {
  let target
  try {
    target = new URL(request.url, backendOrigin)
  } catch {
    sendJson(response, 400, {
      title: 'Solicitud inválida',
      status: 400,
      detail: 'La ruta del API no es válida.',
    })
    return
  }

  const headers = { ...request.headers }
  headers.host = target.host
  headers['x-forwarded-host'] = request.headers.host ?? ''
  headers['x-forwarded-proto'] = 'https'
  headers['x-forwarded-for'] = request.socket.remoteAddress ?? ''
  delete headers.connection

  const upstream = httpsRequest(
    target,
    { method: request.method, headers, timeout: 60_000 },
    (upstreamResponse) => {
      response.writeHead(upstreamResponse.statusCode ?? 502, {
        ...securityHeaders,
        ...upstreamResponse.headers,
      })
      upstreamResponse.pipe(response)
    },
  )

  upstream.on('timeout', () => {
    upstream.destroy()
    if (!response.headersSent) {
      sendJson(response, 503, {
        title: 'Servicio no disponible',
        status: 503,
        detail: 'El API no respondió a tiempo.',
      })
    }
  })
  upstream.on('error', () => {
    if (!response.headersSent) {
      sendJson(response, 503, {
        title: 'Servicio no disponible',
        status: 503,
        detail: 'No fue posible conectar con el API.',
      })
    } else {
      response.destroy()
    }
  })
  request.pipe(upstream)
}

function safePath(urlPath) {
  let decoded
  try {
    decoded = decodeURIComponent(urlPath)
  } catch {
    return null
  }
  const resolved = path.resolve(root, `.${decoded}`)
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) return null
  return resolved
}

async function serveStatic(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { ...securityHeaders, Allow: 'GET, HEAD' })
    response.end()
    return
  }

  const url = new URL(request.url ?? '/', 'http://gradex.local')
  const candidate = safePath(url.pathname)
  if (candidate === null) {
    response.writeHead(404, securityHeaders)
    response.end()
    return
  }

  let file = candidate
  let fileStat
  try {
    fileStat = await stat(file)
    if (fileStat.isDirectory()) {
      file = path.join(file, 'index.html')
      fileStat = await stat(file)
    }
  } catch {
    fileStat = undefined
  }

  if (!fileStat) {
    if (path.extname(url.pathname)) {
      response.writeHead(404, securityHeaders)
      response.end()
      return
    }
    file = path.join(root, 'index.html')
    fileStat = await stat(file)
  }

  const extension = path.extname(file).toLowerCase()
  const isIndex = path.basename(file) === 'index.html'
  const isImmutable = url.pathname.startsWith('/assets/')
  const headers = {
    ...securityHeaders,
    'Content-Type': mime.get(extension) ?? 'application/octet-stream',
    'Content-Length': fileStat.size,
    'Cache-Control': isIndex || extension === '.webmanifest' || path.basename(file) === 'sw.js'
      ? 'no-cache, no-store, must-revalidate'
      : isImmutable
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=3600',
  }

  response.writeHead(200, headers)
  if (request.method === 'HEAD') {
    response.end()
    return
  }
  createReadStream(file).pipe(response)
}

const server = createServer((request, response) => {
  if (request.url === '/api' || request.url?.startsWith('/api/')) {
    proxy(request, response)
    return
  }
  serveStatic(request, response).catch(() => {
    if (!response.headersSent) {
      response.writeHead(500, securityHeaders)
      response.end()
    }
  })
})

server.listen(port, '0.0.0.0', () => {
  console.log(`GradeX frontend escuchando en ${port}`)
})
