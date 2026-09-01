import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages serves this as a project page at /nonprofit-match-finder/,
  // not the domain root — only applies to the production build; the dev
  // server still serves from / so `npm run dev` is unaffected.
  base: command === 'build' ? '/nonprofit-match-finder/' : '/',
  plugins: [react()],
}))
