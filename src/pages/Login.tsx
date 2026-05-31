import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate('/', { replace: true });
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);

    setTimeout(() => {
      const ok = login(email.trim(), senha);
      if (ok) {
        navigate('/', { replace: true });
      } else {
        setErro('Email ou senha incorretos. Tente novamente.');
      }
      setLoading(false);
    }, 400);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: '#000000' }}
    >
      <div className="w-full max-w-sm flex flex-col gap-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-4xl tracking-tight select-none mb-2">
            <span className="text-white font-light">connect</span>
            <span className="text-white font-black">ipan</span>
          </h1>
          <p className="text-gray-500 text-sm">Ministério de Mídia</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-2xl p-6"
          style={{ backgroundColor: '#1A1A1A', border: '1px solid #333333' }}
        >
          <h2 className="text-white font-bold text-lg text-center">Acesso Restrito</h2>

          {erro && (
            <div
              className="rounded-xl px-4 py-3 text-sm text-red-400"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              {erro}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              autoComplete="email"
              className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none"
              style={{
                backgroundColor: '#2A2A2A',
                border: '1px solid #333333',
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none"
              style={{
                backgroundColor: '#2A2A2A',
                border: '1px solid #333333',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50 mt-1"
            style={{ backgroundColor: '#FFFFFF' }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-gray-600 text-xs">
          ConnectFlow IPAN SP — Escalas de Produção
        </p>
      </div>
    </div>
  );
}
