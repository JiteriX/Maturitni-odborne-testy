import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Načte proměnné prostředí (i ty bez VITE_ prefixu, jako je API_KEY na Vercelu)
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    base: './', 
    define: {
      // Toto nahradí 'process.env.API_KEY' v kódu skutečnou hodnotou při buildu
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})