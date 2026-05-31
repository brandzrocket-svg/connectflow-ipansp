import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  mes: number;
  ano: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  user: { email: string; nome: string } | null;
  onLoginClick: () => void;
  onLogout: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function Header({ mes, ano, onPrevMonth, onNextMonth, user, onLoginClick, onLogout, theme, onToggleTheme }: HeaderProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() { setMenuOpen(false); }

  function handleNav(path: string) {
    closeMenu();
    navigate(path);
  }

  return (
    <header
      className="sticky top-0 z-50 w-full px-6 py-4"
      style={{ backgroundColor: 'var(--header-bg)', borderBottom: '1px solid var(--border-color)' }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center cursor-pointer bg-transparent border-0 p-0"
        >
          <span className="text-2xl tracking-tight select-none">
            <span className="font-light" style={{ color: 'var(--text-primary)' }}>connect</span>
            <span className="font-black" style={{ color: 'var(--text-primary)' }}>ipan</span>
          </span>
        </button>

        {/* Desktop: Month Navigator */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={onPrevMonth}
            className="text-xl font-light w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.backgroundColor = 'var(--bg-card-2)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            aria-label="Mês anterior"
          >
            ‹
          </button>
          <span className="font-semibold text-sm tracking-widest uppercase min-w-[140px] text-center" style={{ color: 'var(--text-primary)' }}>
            {MESES_PT[mes - 1]} {ano}
          </span>
          <button
            onClick={onNextMonth}
            className="text-xl font-light w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.backgroundColor = 'var(--bg-card-2)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            aria-label="Próximo mês"
          >
            ›
          </button>
        </div>

        {/* Desktop: Theme + Auth */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            className="text-sm w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-card-2)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {user ? (
            <>
              <span className="text-sm hidden sm:block" style={{ color: 'var(--text-secondary)' }}>
                {user.nome}
              </span>
              <button
                onClick={onLogout}
                className="text-sm rounded-lg px-3 py-1.5 transition-colors"
                style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                Sair
              </button>
            </>
          ) : (
            <button
              onClick={onLoginClick}
              className="text-sm rounded-lg px-3 py-1.5 transition-colors"
              style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              Entrar
            </button>
          )}
        </div>

        {/* Mobile: Hamburger */}
        <button
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="3" y1="5" x2="17" y2="5" />
            <line x1="3" y1="10" x2="17" y2="10" />
            <line x1="3" y1="15" x2="17" y2="15" />
          </svg>
        </button>
      </div>

      {/* Mobile overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={closeMenu}
        />
      )}

      {/* Mobile slide-in panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 w-72 flex flex-col p-6 gap-4 lg:hidden"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderLeft: '1px solid var(--border-color)',
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s ease',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xl tracking-tight select-none">
            <span className="font-light" style={{ color: 'var(--text-primary)' }}>connect</span>
            <span className="font-black" style={{ color: 'var(--text-primary)' }}>ipan</span>
          </span>
          <button
            onClick={closeMenu}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-xl transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            ×
          </button>
        </div>

        {/* Month Navigator */}
        <div
          className="flex items-center justify-between rounded-xl px-4 py-3"
          style={{ backgroundColor: 'var(--bg-card-2)', border: '1px solid var(--border-color)' }}
        >
          <button
            onClick={onPrevMonth}
            className="text-xl font-light w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Mês anterior"
          >
            ‹
          </button>
          <span className="font-semibold text-xs tracking-widest uppercase text-center" style={{ color: 'var(--text-primary)' }}>
            {MESES_PT[mes - 1]} {ano}
          </span>
          <button
            onClick={onNextMonth}
            className="text-xl font-light w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Próximo mês"
          >
            ›
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1">
          {[
            { path: '/', label: '📋 Dashboard' },
            { path: '/visao-geral', label: '📊 Visão Geral' },
            { path: '/sobre', label: 'ℹ️ Sobre o Ministério' },
          ].map(({ path, label }) => (
            <button
              key={path}
              onClick={() => handleNav(path)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-card-2)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              {label}
            </button>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid var(--border-color)' }} />

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-card-2)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
          {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        </button>

        {/* Auth */}
        {user ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs px-4 truncate" style={{ color: 'var(--text-muted)' }}>{user.nome}</p>
            <button
              onClick={() => { onLogout(); closeMenu(); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left"
              style={{ color: '#EF4444' }}
            >
              Sair
            </button>
          </div>
        ) : (
          <button
            onClick={() => { onLoginClick(); closeMenu(); }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left"
            style={{ color: 'var(--text-secondary)' }}
          >
            Entrar
          </button>
        )}
      </div>
    </header>
  );
}
