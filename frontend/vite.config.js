import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      configureServer() {
        return () => {
          console.log('🚀 [TheTipTop] Serveur frontend lancé avec succès sur http://localhost:5173')
        }
      }
    }
  ],
})
