import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Mesmas chaves do projeto Firebase que você já criou (bingo-app-3d6bb).
// Na web, o SDK guarda a sessão de login no navegador automaticamente —
// não precisa da configuração extra de "persistence" que o app mobile usava.
const firebaseConfig = {
  apiKey: 'AIzaSyAHywt9s7q1LmCYWO6wYFzExAxtVa-SVgY',
  authDomain: 'bingo-app-3d6bb.firebaseapp.com',
  projectId: 'bingo-app-3d6bb',
  storageBucket: 'bingo-app-3d6bb.firebasestorage.app',
  messagingSenderId: '1064225129384',
  appId: '1:1064225129384:web:6f69748be90a6355b0939d',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
