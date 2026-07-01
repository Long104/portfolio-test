import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    ...(process.env.ANALYZE ? [visualizer({ open: true, gzipSize: true, brotliSize: true })] : []),
  ],

  resolve: {
    alias: {
      '@': '/src',
    },
  },

  build: {
    target: 'esnext',
    sourcemap: false,
    chunkSizeWarningLimit: 800,

    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom)[\\/]/,
              priority: 20,
            },
            {
              name: 'three',
              test: /node_modules[\\/]three[\\/]/,
              priority: 15,
            },
            {
              name: 'fiber',
              test: /node_modules[\\/]@react-three[\\/]/,
              priority: 15,
            },
          ],
        },
      },
    },
  },

  optimizeDeps: {
    include: ['react', 'react-dom', 'three'],
  },

  server: {
    port: 3000,
    hmr: {
      overlay: true,
    },
  },
})
