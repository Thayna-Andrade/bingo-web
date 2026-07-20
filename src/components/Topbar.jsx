import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Topbar() {
  const { logout } = useAuth();

  return (
    <div className="topbar">
      <Link to="/" className="topbar-brand">
        <span className="topbar-ball">B</span>
        Bingo Marcador
      </Link>
      <button className="topbar-sair" onClick={logout}>
        Sair
      </button>
    </div>
  );
}
