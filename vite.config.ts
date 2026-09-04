import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Plugin para remover crossorigin dos assets no HTML gerado
function removeCrossOrigin(): Plugin {
  return {
    name: 'remove-crossorigin',
    enforce: 'post',
    transformIndexHtml(html) {
      // Remove o atributo crossorigin das tags script e link
      return html.replace(/\s+crossorigin(?:="[^"]*")?/gi, '')
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), removeCrossOrigin()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false
  }
})
