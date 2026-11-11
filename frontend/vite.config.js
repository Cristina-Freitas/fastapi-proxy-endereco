import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BACKEND = 'http://127.0.0.1:8000'

// O navegador só fala com o Vite; o Vite encaminha para o FastAPI.
// Assim não há CORS e o frontend nunca consulta o ViaCEP diretamente.
const proxy = {
  '/endereco': { target: BACKEND, changeOrigin: true },
  // Verificação de disponibilidade da API (selo "API Online/Offline").
  '/api-status': { target: BACKEND, changeOrigin: true },
}

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy },
  preview: { proxy },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
