import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * 검증용 로컬 서버.
 * - dist/ 정적 파일을 서빙하고
 * - /api/party-chat 요청은 esbuild로 번들한 실제 서버리스 핸들러(.tmp/party-chat.mjs)로 넘깁니다.
 *   GEMINI_API_KEY가 없으면 핸들러의 폴백 응답이 그대로 내려옵니다.
 */

const root = path.resolve('dist')
const port = Number(process.env.PORT ?? 4210)
const bundle = path.resolve('.tmp/party-chat.mjs')

let handler = null
try {
  handler = (await import(pathToFileURL(bundle).href)).default
} catch (error) {
  console.error('[serve] api bundle not loaded:', error.message)
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://127.0.0.1')

  if (url.pathname === '/api/party-chat') {
    res.status = (code) => ({
      json: (body) => {
        res.statusCode = code
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify(body))
      },
    })
    if (!handler) {
      res.statusCode = 503
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ error: 'api bundle missing' }))
      return
    }
    try {
      await handler(req, res)
    } catch (error) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ error: String(error) }))
    }
    return
  }

  let filePath = path.join(root, decodeURIComponent(url.pathname))
  if (!filePath.startsWith(root)) {
    res.statusCode = 403
    res.end('forbidden')
    return
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(root, 'index.html')
  }
  const ext = path.extname(filePath).toLowerCase()
  res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream')
  res.setHeader('Cache-Control', 'no-store')
  fs.createReadStream(filePath).pipe(res)
})

server.listen(port, '127.0.0.1', () => {
  console.log(`[serve] http://127.0.0.1:${port} (api: ${handler ? 'on' : 'off'})`)
})
