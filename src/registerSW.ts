import { registerSW } from 'virtual:pwa-register';

registerSW({
  immediate: true,
  onRegistered() {
    // opcional: console.log('SW registrado');
  },
  onRegisterError(error) {
    console.error('SW registration failed:', error);
  },
});
