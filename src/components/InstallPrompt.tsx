import { useEffect, useState } from 'react'
import './pwa-prompts.css'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const dismissedKey = 'pwa-install-dismissed'

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIosDevice() {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function isIosSafari() {
  return isIosDevice() && !/crios|fxios|edgios|opios/i.test(navigator.userAgent)
}

export function InstallPrompt() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [showIosHelp, setShowIosHelp] = useState(false)
  const [hidden, setHidden] = useState(
    () => isStandalone() || localStorage.getItem(dismissedKey) === 'true',
  )

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstallEvent(null)
      setShowIosHelp(false)
      setHidden(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (hidden) return null

  const isIos = isIosDevice()
  if (!installEvent && !isIos) return null

  const dismiss = () => {
    localStorage.setItem(dismissedKey, 'true')
    setShowIosHelp(false)
    setHidden(true)
  }

  const install = async () => {
    if (installEvent) {
      await installEvent.prompt()
      const choice = await installEvent.userChoice
      setInstallEvent(null)
      if (choice.outcome === 'accepted') setHidden(true)
      return
    }
    setShowIosHelp(true)
  }

  return (
    <>
      <div className="pwa-install-bar">
        <span className="pwa-install-text">
          Instale o app na sua tela de início
        </span>
        <button
          type="button"
          className="pwa-button pwa-button-primary"
          onClick={install}
        >
          Instalar
        </button>
        <button
          type="button"
          className="pwa-button pwa-button-ghost"
          onClick={dismiss}
        >
          Agora não
        </button>
      </div>

      {showIosHelp && (
        <div
          className="pwa-modal-backdrop"
          role="presentation"
          onClick={() => setShowIosHelp(false)}
        >
          <div
            className="pwa-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Como instalar no iOS"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Instalar no iPhone ou iPad</h2>
            {isIosSafari() ? (
              <ol>
                <li>
                  Toque no botão <strong>Compartilhar</strong> (quadrado com
                  seta para cima).
                </li>
                <li>
                  Escolha <strong>Adicionar à Tela de Início</strong>.
                </li>
                <li>
                  Toque em <strong>Adicionar</strong>.
                </li>
              </ol>
            ) : (
              <p>
                No iOS a instalação só funciona pelo <strong>Safari</strong>.
                Abra este site no Safari e use{' '}
                <strong>Compartilhar → Adicionar à Tela de Início</strong>.
              </p>
            )}
            <button
              type="button"
              className="pwa-button pwa-button-primary"
              onClick={() => setShowIosHelp(false)}
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  )
}
