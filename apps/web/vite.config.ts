import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { splitVendorChunkPlugin } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  publicDir: 'public',
  plugins: [
    react(),
    splitVendorChunkPlugin(),
    visualizer({
      filename: 'bundle-analysis.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/pages': resolve(__dirname, './src/pages'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/services': resolve(__dirname, './src/services'),
      '@/stores': resolve(__dirname, './src/stores'),
      '@/types': resolve(__dirname, './src/types'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/styles': resolve(__dirname, './src/styles'),
      '@jewelry-seo/shared': resolve(__dirname, '../../packages/shared/src'),
    },
  },
  server: {
    port: 4000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // More granular code splitting
        manualChunks: (id) => {
          // Core vendor chunks
          if (id.includes('node_modules/react')) return 'react-vendor'
          if (id.includes('node_modules/react-router-dom')) return 'router-vendor'
          if (id.includes('node_modules/@headlessui') || id.includes('node_modules/@heroicons')) return 'ui-vendor'
          if (id.includes('node_modules/zustand')) return 'state-vendor'
          if (id.includes('node_modules/@tanstack/react-query')) return 'query-vendor'
          if (id.includes('node_modules/axios') || id.includes('node_modules/zod') || id.includes('node_modules/clsx')) return 'utils-vendor'
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) return 'charts-vendor'
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/@hookform')) return 'forms-vendor'

          // Feature-based chunks
          if (id.includes('/pages/')) {
            const pageMatch = id.match(/\/pages\/([^\/]+)/)
            if (pageMatch) {
              const pageName = pageMatch[1]
              return `page-${pageName}`
            }
          }

          if (id.includes('/components/ui/')) {
            return 'ui-components'
          }

          if (id.includes('/hooks/')) {
            return 'hooks'
          }

          // Default chunk for other modules
          if (id.includes('node_modules')) {
            return 'vendor'
          }

          return 'app'
        },
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'chunks/[name].[hash].js',
        entryFileNames: 'entries/[name].[hash].js',
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'recharts', 'zustand'],
    exclude: ['fsevents']
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'src/test/**',
        'src/main.tsx',
        '**/*.d.ts',
        '**/*.config.*'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
})