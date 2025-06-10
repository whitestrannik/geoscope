import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Use automatic JSX runtime (default for React 19)
      jsxRuntime: 'automatic'
    }), 
    tailwindcss()
  ],
  server: {
    port: 3000,
    hmr: true // Enable HMR for React 19
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // React 19 optimization
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
})
