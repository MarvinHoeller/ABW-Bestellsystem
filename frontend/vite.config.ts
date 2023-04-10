import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {

  if (process.env.VITE_SUBFOLDER.startsWith('/'))
    process.env.VITE_SUBFOLDER = process.env.VITE_SUBFOLDER.substring(1);
    
  return ({
    plugins: [react(), tsconfigPaths()],
    logLevel: 'error',
    base: mode === 'development' ? '/' : `/${process.env.VITE_SUBFOLDER}`,
  });
})