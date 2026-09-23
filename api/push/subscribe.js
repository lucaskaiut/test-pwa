export default function handler(request, response) {
  if (request.method === 'POST') {
    response.status(201).json({ ok: true })
    return
  }

  if (request.method === 'DELETE') {
    response.status(200).json({ ok: true })
    return
  }

  response.status(405).json({ error: 'Método não permitido' })
}
