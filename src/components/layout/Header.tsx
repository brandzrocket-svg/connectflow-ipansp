interface HeaderProps {
  user: { email: string; nome: string } | null;
  onLoginClick: () => void;
  onLogout: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onNavTo: (view: string) => void;
  currentView: string;
  onStartTutorial: () => void;
}

export default function Header({
  user, onLoginClick, onLogout, theme, onToggleTheme, onNavTo, onStartTutorial,
}: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-50 w-full px-5 py-3 flex items-center justify-between gap-4"
      style={{ backgroundColor: 'var(--header-bg)', borderBottom: '1px solid var(--border-color)', height: '56px' }}
    >
      {/* Logo */}
      <button
        onClick={() => onNavTo('home')}
        className="flex items-center flex-shrink-0 bg-transparent border-0 p-0 cursor-pointer"
      >
        <img
          src="/logo-connect.png"
          alt="Connect IPAN SP"
          style={{ height: '28px', width: 'auto', objectFit: 'contain' }}
        />
      </button>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Tutorial button */}
        <button
          onClick={onStartTutorial}
          className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hidden sm:flex items-center gap-1.5"
          style={{ color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--text-muted)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
        >
          <span style={{ fontSize: '10px' }}>▶</span>
          Iniciar Tutorial
        </button>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-sm"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-card-2)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* Auth */}
        {user ? (
          <button
            onClick={onLogout}
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Sair
          </button>
        ) : (
          <button
            onClick={onLoginClick}
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Entrar
          </button>
        )}
      </div>
    </header>
  );
}
