import https from 'node:https'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type ProxyOptions } from 'vite'

import { NOVA_FACADE_API_BASE_URL, NOVA_FACADE_DEV_PROXY_PATH } from './src/config'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const novaFacadeOrigin = new URL(NOVA_FACADE_API_BASE_URL).origin

const novaFacadeProxy: Record<string, ProxyOptions> = {
  [NOVA_FACADE_DEV_PROXY_PATH]: {
    target: NOVA_FACADE_API_BASE_URL,
    changeOrigin: true,
    secure: false,
    agent: new https.Agent({ rejectUnauthorized: false }),
    rewrite: (proxyPath) => proxyPath.replace(new RegExp(`^${NOVA_FACADE_DEV_PROXY_PATH}`), '') || '/',
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq, req) => {
        const authorization = req.headers.authorization
        if (typeof authorization === 'string') {
          proxyReq.setHeader('Authorization', authorization)
        }
      })
      proxy.on('proxyRes', (proxyRes) => {
        const location = proxyRes.headers.location
        if (typeof location !== 'string') return
        try {
          const redirected = new URL(location, NOVA_FACADE_API_BASE_URL)
          if (redirected.origin !== novaFacadeOrigin) return
          proxyRes.headers.location = `${NOVA_FACADE_DEV_PROXY_PATH}${redirected.pathname}${redirected.search}`
        } catch {
          // dejar Location original
        }
      })
    },
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: novaFacadeProxy,
  },
  preview: {
    proxy: novaFacadeProxy,
  },
})
