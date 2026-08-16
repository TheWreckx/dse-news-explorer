import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/dse-news-explorer/',
  build: {
    // Without a target, the CSS minifier rewrites "max-width: 768px" into
    // modern range syntax ("width<=768px"). Older Android browsers — a real
    // share of this site's audience — don't parse range syntax and silently
    // drop the whole @media block, which breaks the mobile layout entirely
    // rather than degrading gracefully. Targeting a few years back keeps
    // media queries in the traditional form real devices understand.
    cssTarget: ['chrome100', 'safari15', 'firefox100', 'edge100'],
  },
})
