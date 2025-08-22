import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import commonjs from 'vite-plugin-commonjs'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(
    {
      babel: {
        plugins: [["module:@preact/signals-react-transform"]],
      },
    }
  ),
  commonjs(),
  ],
  server: {
    host: true, // This enables access via your local IP address
    port: 3001  // You can change this if needed
  }
})
