import { useEffect, useState } from 'react'
import {
  disablePushNotifications,
  enablePushNotifications,
  getSubscription,
  isIosDevice,
  isPushSupported,
  isStandaloneDisplay,
  sendTestPush,
} from '../lib/push'
import './pwa-prompts.css'
import './push-notifications.css'

type Feedback = { type: 'ok' | 'error'; text: string } | null

const permissionLabels: Record<NotificationPermission, string> = {
  default: 'permissão pendente',
  granted: 'permissão concedida',
  denied: 'permissão negada',
}

export function PushNotifications() {
  const supported = isPushSupported()
  const [subscribed, setSubscribed] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>(
    supported ? Notification.permission : 'denied',
  )
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)

  useEffect(() => {
    if (!supported) return
    getSubscription()
      .then((subscription) => {
        setSubscribed(Boolean(subscription))
        setPermission(Notification.permission)
      })
      .catch(() => undefined)
  }, [supported])

  const iosNeedsInstall = isIosDevice() && !isStandaloneDisplay()

  const enable = async () => {
    setBusy(true)
    setFeedback(null)
    try {
      await enablePushNotifications()
      setPermission(Notification.permission)
      setSubscribed(true)
      setFeedback({
        type: 'ok',
        text: 'Inscrição criada! Clique em "Enviar teste" ou rode o script com --every 60.',
      })
    } catch (error) {
      setPermission(supported ? Notification.permission : 'denied')
      setFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erro inesperado.',
      })
    } finally {
      setBusy(false)
    }
  }

  const disable = async () => {
    setBusy(true)
    setFeedback(null)
    try {
      await disablePushNotifications()
      setSubscribed(false)
      setFeedback({ type: 'ok', text: 'Notificações desativadas.' })
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erro inesperado.',
      })
    } finally {
      setBusy(false)
    }
  }

  const sendTest = async () => {
    setBusy(true)
    setFeedback(null)
    try {
      await sendTestPush()
      setFeedback({
        type: 'ok',
        text: 'Push enviado. Veja se a notificação apareceu.',
      })
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erro inesperado.',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id="push">
      <h2>Notificações push</h2>
      {supported ? (
        <p className="push-status">
          Status: {permissionLabels[permission]} ·{' '}
          {subscribed ? 'inscrito' : 'não inscrito'}
        </p>
      ) : (
        <p className="push-status">
          Este navegador não suporta notificações push.
        </p>
      )}

      {iosNeedsInstall && (
        <p className="push-hint">
          No iPhone/iPad o push só funciona com o app instalado na Tela de
          Início (iOS 16.4+) e aberto por ele. Adicione pelo Safari antes de
          ativar.
        </p>
      )}

      {supported && (
        <div className="push-actions">
          {subscribed ? (
            <>
              <button
                type="button"
                className="pwa-button pwa-button-primary"
                onClick={() => void sendTest()}
                disabled={busy}
              >
                Enviar teste
              </button>
              <button
                type="button"
                className="pwa-button pwa-button-ghost"
                onClick={() => void disable()}
                disabled={busy}
              >
                Desativar
              </button>
            </>
          ) : (
            <button
              type="button"
              className="pwa-button pwa-button-primary"
              onClick={() => void enable()}
              disabled={busy}
            >
              Ativar notificações
            </button>
          )}
        </div>
      )}

      {feedback && (
        <p className={`push-feedback push-feedback-${feedback.type}`}>
          {feedback.text}
        </p>
      )}
    </section>
  )
}
