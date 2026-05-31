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

  return (
    <header
      style={{ backgroundColor: 'var(--header-bg)', borderBottom: '1px solid var(--border-color)' }}
      className="sticky top-0 z-50 w-full px-6 py-4"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center cursor-pointer bg-transparent border-0 p-0"
        >
          <span className="text-2xl tracking-tight select-none">
            <span style={{ color: 'var(--text-primary)' }} className="font-light">connect</span>
            <span style={{ color: 'var(--text-primary)' }} className="font-black">ipan</span>
          </span>
        </button>

        {/* Month Navigator */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPrevMonth}
            className="text-gray-500 hover:text-white transition-colors duration-150 text-xl font-light w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"
            aria-label="Mês anterior"
          >
            ‹
          </button>
          <span className="text-white font-semibold text-sm tracking-widest uppercase min-w-[140px] text-center">
            {MESES_PT[mes - 1]} {ano}
          </span>
          <button
            onClick={onNextMonth}
            className="text-gray-500 hover:text-white transition-colors duration-150 text-xl font-light w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"
            aria-label="Próximo mês"
          >
            ›
          </button>
        </div>

        {/* Auth + Theme toggle */}
        <div className="flex items-center gap-3">
          {/* Theme toggle button */}
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            className="text-gray-400 hover:text-white text-sm w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {user ? (
            <>
              <span className="text-gray-400 text-sm hidden sm:block">
                {user.nome}
              </span>
              <button
                onClick={onLogout}
                style={{ borderColor: 'var(--border-color)' }}
                className="text-gray-400 hover:text-white text-sm border rounded-lg px-3 py-1.5 transition-colors duration-150 hover:border-white/40"
              >
                Sair
              </button>
            </>
          ) : (
            <button
              onClick={onLoginClick}
              style={{ borderColor: 'var(--border-color)' }}
              className="text-gray-400 hover:text-white text-sm border rounded-lg px-3 py-1.5 transition-colors duration-150 hover:border-white/40"
            >
              Entrar
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
