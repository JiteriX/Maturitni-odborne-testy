
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Změna na relativní cesty - funguje spolehlivě na Renderu i při otevření z disku
})
