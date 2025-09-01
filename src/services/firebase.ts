// src/services/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, GoogleAuthProvider, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

function required(name: string, value: string | undefined) {
  if (!value) throw new Error(`[Firebase ENV] Faltando ${name}. Verifique as env VITE_* no Vercel.`);
  return value;
}

const apiKey = required('VITE_FIREBASE_API_KEY', import.meta.env.VITE_FIREBASE_API_KEY);
if (!apiKey.startsWith('AIza')) {
  // Ajuda a diagnosticar build com chave errada
  throw new Error('[Firebase ENV] apiKey inválida (não começa com "AIza"). Confira as env no Vercel.');
}

const firebaseConfig = {
  apiKey,
  authDomain: required('VITE_FIREBASE_AUTH_DOMAIN', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: required('VITE_FIREBASE_PROJECT_ID', import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: required('VITE_FIREBASE_STORAGE_BUCKET', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: required('VITE_FIREBASE_MESSAGING_SENDER_ID', import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: required('VITE_FIREBASE_APP_ID', import.meta.env.VITE_FIREBASE_APP_ID),
};

export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// persistência padrão
auth.setPersistence(browserLocalPersistence).catch(() => {});

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
