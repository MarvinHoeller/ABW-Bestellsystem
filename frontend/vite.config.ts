import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  return ({
      plugins: [react(), tsconfigPaths()],
      envPrefix: 'BS_',
      logLevel: 'error',
  });
})