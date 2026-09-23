import { createServer } from 'node:http'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import webPush from 'web-push'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const configPath = resolve(root, 'push.config.json')
const subscriptionPath = resolve(root, 'push.subscription.json')

const args = process.argv.slice(2)
function argValue(name, fallback) {
  const index = args.indexOf(`--${name}`)
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback
}

const port = Number(argValue('port', process.env.PUSH_SERVER_PORT ?? 8787))
const every = Number(argValue('every', 0))
const defaultTitle = argValue('title', 'Test PWA')
const defaultBody = argValue('body', 'Notificação de teste')

function loadConfig() {
  if (existsSync(configPath)) {
    return JSON.parse(readFileSync(configPath, 'utf8'))
  }
  const keys = webPush.generateVAPIDKeys()
  const created = {
    subject: 'mailto:test@example.com',
    publicKey: keys.publicKey,
    privateKey: keys.privateKey,
  }
  writeFileSync(configPath, `${JSON.stringify(created, null, 2)}\n`)
  console.log('Chaves VAPID geradas em push.config.json')
  return created
}

const config = loadConfig()
webPush.setVapidDetails(config.subject, config.publicKey, config.privateKey)

function readSubscription() {
  if (!existsSync(subscriptionPath)) return null
  return JSON.parse(readFileSync(subscriptionPath, 'utf8'))
}

function saveSubscription(subscription) {
  writeFileSync(subscriptionPath, `${JSON.stringify(subscription, null, 2)}\n`)
}

async function sendPush(overrides = {}) {
  const subscription = readSubscription()
  if (!subscription) {
    console.log('Nenhuma inscrição salva. Ative as notificações no app primeiro.')
    return false
  }

  const payload = JSON.stringify({
    title: overrides.title || defaultTitle,
    body:
      overrides.body ||
      `${defaultBody} — ${new Date().toLocaleTimeString('pt-BR')}`,
    url: overrides.url || '/',
  })

  try {
    await webPush.sendNotification(subscription, payload)
    console.log(`[${new Date().toLocaleTimeString('pt-BR')}] Push enviado`)
    return true
  } catch (error) {
    if (error.statusCode === 404 || error.statusCode === 410) {
      console.log('Inscrição expirada. Ative as notificações novamente no app.')
      rmSync(subscriptionPath, { force: true })
    } else {
      console.error('Falha ao enviar push:', error.message)
    }
    return false
  }
}

function sendJson(response, status, data) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(data))
}

function readBody(request) {
  return new Promise((resolvePromise, reject) => {
    let body = ''
    request.on('data', (chunk) => {
      body += chunk
    })
    request.on('end', () => {
      try {
        resolvePromise(body ? JSON.parse(body) : {})
      } catch (error) {
        reject(error)
      }
    })
    request.on('error', reject)
  })
}

const server = createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (request.method === 'OPTIONS') {
    response.writeHead(204)
    response.end()
    return
  }

  const url = new URL(request.url ?? '/', `http://localhost:${port}`)

  if (request.method === 'GET' && url.pathname === '/api/push/public-key') {
    sendJson(response, 200, { publicKey: config.publicKey })
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/push/subscribe') {
    try {
      const subscription = await readBody(request)
      if (!subscription || !subscription.endpoint) {
        sendJson(response, 400, { error: 'Inscrição inválida' })
        return
      }
      saveSubscription(subscription)
      console.log('Inscrição salva em push.subscription.json')
      sendJson(response, 201, { ok: true })
    } catch {
      sendJson(response, 400, { error: 'JSON inválido' })
    }
    return
  }

  if (request.method === 'DELETE' && url.pathname === '/api/push/subscribe') {
    rmSync(subscriptionPath, { force: true })
    console.log('Inscrição removida')
    sendJson(response, 200, { ok: true })
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/push/send') {
    try {
      const overrides = await readBody(request)
      const sent = await sendPush(overrides)
      sendJson(response, sent ? 200 : 404, { ok: sent })
    } catch {
      sendJson(response, 400, { error: 'JSON inválido' })
    }
    return
  }

  sendJson(response, 404, { error: 'Rota não encontrada' })
})

server.listen(port, () => {
  console.log(`Servidor de push em http://localhost:${port}`)
  console.log(
    'Rotas: GET /api/push/public-key · POST /api/push/subscribe · DELETE /api/push/subscribe · POST /api/push/send',
  )
  console.log('O proxy do Vite encaminha /api/push para cá (npm run dev).')

  if (every > 0) {
    console.log(`Enviando push a cada ${every}s (Ctrl+C para parar)...`)
    void sendPush()
    setInterval(() => {
      void sendPush()
    }, every * 1000)
  }
})
