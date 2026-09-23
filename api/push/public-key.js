export default function handler(request, response) {
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Método não permitido' })
    return
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY
  if (!publicKey) {
    response.status(500).json({ error: 'VAPID_PUBLIC_KEY não configurada' })
    return
  }

  response.setHeader('Cache-Control', 'public, max-age=3600')
  response.status(200).json({ publicKey })
}
