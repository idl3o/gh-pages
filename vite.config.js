import { defineConfig } from 'vite';

// Import polyfills plugin
let nodePolyfillsPlugin = [];
try {
  // Modern approach with top-level await
  const { nodePolyfills } = await import('vite-plugin-node-polyfills');
  nodePolyfillsPlugin.push(
    nodePolyfills({
      protocolImports: true,
      globals: {
        process: true,
        Buffer: true
      }
    })
  );
} catch (e) {
  console.warn(
    'Warning: vite-plugin-node-polyfills is not installed. Some Web3 features may not work correctly.'
  );
  console.warn('Install it with: npm install vite-plugin-node-polyfills --save-dev');
}

export default defineConfig({
  plugins: nodePolyfillsPlugin,
  define: {
    global: 'globalThis',
    'process.env': process.env
  },
  resolve: {
    alias: {
      // Modern aliases for better compatibility
      crypto: 'crypto-js',
      stream: 'stream-browserify',
      path: 'path-browserify',
      '@': new URL('./src', import.meta.url).pathname,
      'web3-components': new URL('./src/components/web3', import.meta.url).pathname
    }
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          web3: [
            'ethers',
            'web3',
            'viem',
            '@wagmi/core',
            '@web3modal/wagmi',
            '@rainbow-me/rainbowkit'
          ],
          ui: ['react', 'react-dom'],
          streaming: ['@livepeer/react', 'web3-stream']
        }
      }
    },
    commonjsOptions: {
      transformMixedEsModules: true
    },
    target: 'es2022' // Use modern JS features
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2022',
      supported: {
        bigint: true
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    cors: true
  }
});
