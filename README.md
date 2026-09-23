# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## PWA (instalável no Android e iOS)

O app já vem com manifest, service worker (funciona offline), ícones, splash screens do iOS e prompt de instalação.

- `npm run dev` — testa o PWA em `http://localhost:5173` (instalável em localhost).
- `npm run build && npm run preview` — testa a versão de produção.
- `npm run pwa:assets` — regenera os ícones a partir de `public/favicon.svg`.
- `npm run pwa:splash` — regenera os splash screens do iOS em `public/splash/`.

> A instalação no celular exige HTTPS. No Android, use o botão "Instalar" (Chrome). No iOS, use Safari → Compartilhar → Adicionar à Tela de Início.

### Testar notificações push

1. `npm run push:server` — gera as chaves VAPID (`push.config.json`) e inicia o servidor em `http://localhost:8787`.
2. `npm run dev` — o Vite encaminha `/api/push` para esse servidor.
3. No app, clique em **Ativar notificações** e depois em **Enviar teste**.
4. Notificações recorrentes: `npm run push:server -- --every 60` (envia a cada 60s). Flags: `--title`, `--body`, `--port`.
5. No iPhone: o push só aparece com o PWA instalado na Tela de Início (iOS 16.4+) e via HTTPS — use um túnel (`cloudflared tunnel --url http://localhost:5173`) porque o celular não acessa `localhost`.

### Push em produção na Vercel

Na Vercel o app é estático, então as rotas `/api/push/*` são funções serverless em `api/push/` (teste manual pelo botão, sem banco de dados).

1. Em **Settings → Environment Variables** do projeto na Vercel, adicione (valores estão em `push.config.json`):
   - `VAPID_PUBLIC_KEY` — chave pública
   - `VAPID_PRIVATE_KEY` — chave privada
   - `VAPID_SUBJECT` — ex.: `mailto:seu@email.com`
2. Faça o deploy: `vercel --prod` (CLI) ou `git push`, se o projeto estiver conectado a um repositório.
3. No celular, abra o app **instalado**, toque em **Ativar notificações** e depois em **Enviar teste**.

Rotas publicadas: `GET /api/push/public-key`, `POST /api/push/subscribe` e `POST /api/push/send` (recebe `{ subscription, title, body, url }`). O envio recorrente a cada 60s com o app fechado precisa de cron de 1 minuto (Cloudflare Worker) ou do script local `--every 60` no PC.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
