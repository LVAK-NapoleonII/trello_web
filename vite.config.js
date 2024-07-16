import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  //based : './'
  resolves: {
    alias: [
      {find: '~', replacement: '/src'}
    ]
  }
})
