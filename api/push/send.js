import webPush from 'web-push'

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Método não permitido' })
    return
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) {
    response
      .status(500)
      .json({ error: 'VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY não configuradas' })
    return
  }

  const { subscription, title, body, url, tag } = request.body ?? {}
  if (!subscription || !subscription.endpoint) {
    response.status(400).json({ error: 'Inscrição ausente no corpo da requisição' })
    return
  }

  try {
    webPush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:test@example.com',
      publicKey,
      privateKey,
    )
    const payload = JSON.stringify({
      title: title || 'Test PWA',
      body: body || 'Notificação de teste',
      url: url || '/',
      tag,
    })
    await webPush.sendNotification(subscription, payload)
    response.status(200).json({ ok: true })
  } catch (error) {
    response
      .status(error.statusCode && error.statusCode < 500 ? error.statusCode : 502)
      .json({ ok: false, error: error.message })
  }
}
