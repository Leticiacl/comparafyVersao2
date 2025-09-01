// src/pwa.ts - registers the service worker (production only)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.debug('SW registration failed:', err);
    });
  });
}