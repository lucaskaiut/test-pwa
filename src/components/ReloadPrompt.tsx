import { useRegisterSW } from 'virtual:pwa-register/react'
import './pwa-prompts.css'

export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return
      setInterval(() => {
        registration.update()
      }, 60 * 60 * 1000)
    },
  })

  if (!offlineReady && !needRefresh) return null

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  return (
    <div className="pwa-toast" role="status">
      <span>
        {needRefresh
          ? 'Nova versão disponível.'
          : 'App pronto para uso offline.'}
      </span>
      {needRefresh && (
        <button
          type="button"
          className="pwa-button pwa-button-primary"
          onClick={() => void updateServiceWorker(true)}
        >
          Atualizar
        </button>
      )}
      <button type="button" className="pwa-button pwa-button-ghost" onClick={close}>
        Fechar
      </button>
    </div>
  )
}
