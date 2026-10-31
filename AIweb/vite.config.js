import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages serves the site from /<repo-name>/; the deploy workflow sets VITE_BASE
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: {
    port: 5173,
    open: '/login',
    // In development, forward /api calls to the Spring Boot backend
    proxy: { '/api': 'http://localhost:8080' },
  },
});
