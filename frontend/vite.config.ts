import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import react from '@vitejs/plugin-react-swc'

/** @type {import('vite').UserConfig} */
export default ({ mode }: { mode: string }) => {

  if (process.env.VITE_SUBFOLDER && !process.env.VITE_SUBFOLDER.startsWith('/'))
    process.env.VITE_SUBFOLDER = '/' + process.env.VITE_SUBFOLDER;

  if (process.env.VITE_SUBFOLDER && !process.env.VITE_SUBFOLDER.endsWith('/'))
    process.env.VITE_SUBFOLDER = process.env.VITE_SUBFOLDER + '/';

  return defineConfig({
    plugins: [react(), tsconfigPaths()],
    base: mode === 'development' ? '/' : process.env.VITE_SUBFOLDER ?? '/'
  });
}
