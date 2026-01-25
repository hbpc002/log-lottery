// Vite config to allow external host access
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: true,
    // Allow connections from the blocked host
    allowedHosts: ["6719.app.cloudstudio.work"]
  }
})
