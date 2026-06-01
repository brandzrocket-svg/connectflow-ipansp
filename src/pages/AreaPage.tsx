import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import Header from '../components/layout/Header';
import AreaPanel from '../components/area/AreaPanel';
import { AREAS } from '../constants/areas';

export default function AreaPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const area = AREAS.find(a => a.id === slug);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, navigate]);

  if (!area) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Área não encontrada</p>
          <button onClick={() => navigate('/')} className="mt-4 text-sm underline" style={{ color: 'var(--text-secondary)' }}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Header
        user={user ? { email: user.email ?? '', nome: user.email ?? '' } : null}
        onLoginClick={() => navigate('/login')}
        onLogout={logout}
        theme={theme}
        onToggleTheme={toggleTheme}
        onNavTo={() => navigate('/')}
        currentView={area.id}
        onStartTutorial={() => {}}
      />
      <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm font-medium mb-6 group"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          <span className="group-hover:-translate-x-0.5 transition-transform inline-block">←</span>
          Dashboard
        </button>
        <AreaPanel area={area} isAuthenticated={isAuthenticated} user={user ? { email: user.email ?? '' } : null} />
      </div>
    </div>
  );
}
