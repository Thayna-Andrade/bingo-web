import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function mensagemDeErro(codigo) {
  const mapa = {
    'auth/email-already-in-use': 'Esse e-mail já tem uma conta. Tente entrar em vez de cadastrar.',
    'auth/invalid-email': 'E-mail inválido.',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
    'auth/user-not-found': 'Não encontramos uma conta com esse e-mail.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/unauthorized-domain': 'Este site ainda não está autorizado no Firebase (avise quem configurou o projeto).',
  };
  return mapa[codigo] || 'Algo deu errado. Tente novamente.';
}

export default function LoginPage() {
  const { login, cadastrar } = useAuth();
  const [modo, setModo] = useState('login');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function handleEnviar(e) {
    e.preventDefault();
    setErro('');
    if (!email.trim() || !senha.trim() || (modo === 'cadastro' && !nome.trim())) {
      setErro('Preencha todos os campos.');
      return;
    }
    setEnviando(true);
    try {
      if (modo === 'cadastro') {
        await cadastrar(nome, email, senha);
      } else {
        await login(email, senha);
      }
    } catch (e) {
      setErro(mensagemDeErro(e.code));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login-shell">
      <form className="login-caixa" onSubmit={handleEnviar}>
        <span className="login-emoji">🎱</span>
        <h1 className="login-titulo">Bingo Marcador</h1>
        <p className="login-subtitulo">Marque todas as suas cartelas de uma vez só</p>

        {erro && <div className="erro-texto">{erro}</div>}

        {modo === 'cadastro' && (
          <input
            className="campo"
            placeholder="Seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        )}
        <input
          className="campo"
          placeholder="Seu e-mail"
          type="email"
          autoCapitalize="none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="campo"
          placeholder="Senha (mínimo 6 caracteres)"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        <button className="botao botao-primario" type="submit" disabled={enviando}>
          {enviando ? 'Entrando...' : modo === 'cadastro' ? 'Criar conta' : 'Entrar'}
        </button>

        <button
          type="button"
          className="link-trocar-modo"
          onClick={() => setModo(modo === 'cadastro' ? 'login' : 'cadastro')}
        >
          {modo === 'cadastro' ? 'Já tem conta? Entrar' : 'Ainda não tem conta? Criar conta'}
        </button>
      </form>
    </div>
  );
}
