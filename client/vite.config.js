import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // <-- Должно быть это

export default defineConfig({
  plugins: [
    tailwindcss(), // <-- Должно быть выше реакта
    react(),
  ],
})