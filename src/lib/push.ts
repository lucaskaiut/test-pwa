export interface PushMessage {
  title?: string
  body?: string
  url?: string
  tag?: string
}

const PUSH_API = '/api/push'

let cachedPublicKey = ''

export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function isIosDevice(): boolean {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i += 1) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
}

async function fetchVapidPublicKey(): Promise<string> {
  if (cachedPublicKey) return cachedPublicKey

  const envKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
  if (envKey) {
    cachedPublicKey = envKey
    return envKey
  }

  const response = await fetch(`${PUSH_API}/public-key`)
  if (!response.ok) {
    throw new Error(
      'Servidor de push indisponível. Rode "npm run push:server" no terminal.',
    )
  }
  const data = (await response.json()) as { publicKey?: string }
  if (!data.publicKey) {
    throw new Error('O servidor de push não retornou uma chave VAPID.')
  }
  cachedPublicKey = data.publicKey
  return data.publicKey
}

async function registerSubscription(
  subscription: PushSubscription,
): Promise<void> {
  const response = await fetch(`${PUSH_API}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription.toJSON()),
  })
  if (!response.ok) {
    throw new Error(
      'Inscrição criada no navegador, mas não foi salva no servidor de push.',
    )
  }
}

export async function getSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null
  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

export async function enablePushNotifications(): Promise<PushSubscription> {
  if (!isPushSupported()) {
    throw new Error('Este navegador não suporta notificações push.')
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error(
      'Permissão de notificação não concedida. No iPhone, só aparece o pedido com o app instalado na Tela de Início.',
    )
  }

  const registration = await navigator.serviceWorker.ready
  const existing = await registration.pushManager.getSubscription()
  if (existing) {
    await registerSubscription(existing)
    return existing
  }

  const publicKey = await fetchVapidPublicKey()
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  })
  await registerSubscription(subscription)
  return subscription
}

export async function disablePushNotifications(): Promise<void> {
  if (!isPushSupported()) return
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (subscription) {
    await subscription.unsubscribe()
  }
  await fetch(`${PUSH_API}/subscribe`, { method: 'DELETE' }).catch(
    () => undefined,
  )
}

export async function sendTestPush(message: PushMessage = {}): Promise<void> {
  const response = await fetch(`${PUSH_API}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  })
  if (!response.ok) {
    throw new Error(
      'Falha ao pedir o envio. O servidor de push está rodando e com inscrição salva?',
    )
  }
}
