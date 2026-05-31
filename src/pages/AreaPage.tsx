import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEventos } from '../hooks/useEventos';
import { useTheme } from '../hooks/useTheme';
import Header from '../components/layout/Header';
import AreaPanel from '../components/area/AreaPanel';
import { AREAS } from '../constants/areas';

export default function AreaPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(6);
  const area = AREAS.find(a => a.id === slug);
  const { eventos, refresh: refreshEventos, loading: loadingEventos } = useEventos(year, month);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => { refreshEventos(); }, [refreshEventos, year, month]);

  if (!area) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Área não encontrada</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-sm transition-colors underline"
            style={{ color: 'var(--text-secondary)' }}
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const eventosSorted = [...eventos].sort((a, b) => a.data.localeCompare(b.data));

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Header
        mes={month}
        ano={year}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
        user={user ? { email: user.email ?? '', nome: user.email ?? '' } : null}
        onLoginClick={() => navigate('/login')}
        onLogout={logout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm font-medium mb-6 transition-all group"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          <span className="group-hover:-translate-x-0.5 transition-transform inline-block">←</span>
          Dashboard
        </button>

        {loadingEventos ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton rounded-2xl h-24" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        ) : (
          <AreaPanel
            area={area}
            year={year}
            month={month}
            eventos={eventosSorted}
            isAuthenticated={isAuthenticated}
            user={user ? { email: user.email ?? '' } : null}
          />
        )}
      </div>
    </div>
  );
}
