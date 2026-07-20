import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebaseConfig';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setCarregando(false);
    });
    return unsubscribe;
  }, []);

  async function cadastrar(nome, email, senha) {
    const credencial = await createUserWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      senha
    );
    await updateProfile(credencial.user, { displayName: nome.trim() });
    setUsuario({ ...credencial.user, displayName: nome.trim() });
    return credencial.user;
  }

  async function login(email, senha) {
    const credencial = await signInWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      senha
    );
    return credencial.user;
  }

  async function logout() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, cadastrar, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de um AuthProvider');
  return ctx;
}
