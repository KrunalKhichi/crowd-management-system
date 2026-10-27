import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Stable vendor chunks so app deploys don't invalidate cached libraries.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (
            /[\\/](recharts|d3-[^\\/]+|victory-vendor|decimal\.js-light|es-toolkit|immer|reselect|@reduxjs|react-redux|redux)[\\/]/.test(
              id,
            )
          )
            return 'vendor-charts'
          if (
            /[\\/](socket\.io-client|engine\.io-client|socket\.io-parser|engine\.io-parser|@socket\.io|xmlhttprequest-ssl)[\\/]/.test(
              id,
            )
          )
            return 'vendor-socket'
          if (/[\\/](react|react-dom|scheduler|react-router|@tanstack)[\\/]/.test(id)) return 'vendor-react'
          if (/[\\/](zod|react-hook-form|@hookform)[\\/]/.test(id)) return 'vendor-forms'
          return undefined
        },
      },
    },
  },
})
