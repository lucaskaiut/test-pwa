import { InstallPrompt } from './components/InstallPrompt'
import { PushNotifications } from './components/PushNotifications'
import { ReloadPrompt } from './components/ReloadPrompt'
import './App.css'

function App() {
  return (
    <>
      <main>
        <header className="app-header">
          <img src="/pwa-192x192.png" alt="" width="88" height="88" />
          <h1>Test PWA</h1>
          <p>Instale o app e teste as notificações push no Android e iOS.</p>
        </header>

        <PushNotifications />
      </main>

      <ReloadPrompt />
      <InstallPrompt />
    </>
  )
}

export default App
