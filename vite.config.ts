import { defineConfig } from 'vite';

// Multi-page build: the main page plus /calendar.html.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        calendar: 'calendar.html',
      },
    },
  },
});
