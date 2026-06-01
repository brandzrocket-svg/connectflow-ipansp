import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEventos } from '../hooks/useEventos';
import { useEscalas } from '../hooks/useEscalas';
import { useTheme } from '../hooks/useTheme';
import Header from '../components/layout/Header';
import EventoCard from '../components/dashboard/EventoCard';
import AreaPanel from '../components/area/AreaPanel';
import VisaoGeralPanel from '../panels/VisaoGeralPanel';
import SobrePanel from '../panels/SobrePanel';
import Tutorial from '../components/Tutorial';
import { AREAS } from '../constants/areas';

const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

interface NovoEventoForm {
  data: string;
  titulo: string;
  descricao: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, navigate]);

  // View state — 'home' | 'visao-geral' | 'sobre' | '<areaId>'
  const [view, setView] = useState('home');

  // Home panel month state
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(6);

  const { eventos, addEvento, removeEvento, refresh: refreshEventos, loading: loadingEventos } = useEventos(year, month);
  const { escalas, refresh: refreshEscalas, loading: loadingEscalas } = useEscalas();
  const [showAddEvento, setShowAddEvento] = useState(false);
  const [novoEvento, setNovoEvento] = useState<NovoEventoForm>({ data: '', titulo: '', descricao: '' });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { refreshEventos(); }, [refreshEventos]);

  const selectedArea = AREAS.find(a => a.id === view) ?? null;
  const loading = loadingEventos || loadingEscalas;
  const eventosSorted = [...eventos].sort((a, b) => a.data.localeCompare(b.data));

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  async function handleAddEvento(e: React.FormEvent) {
    e.preventDefault();
    if (!novoEvento.data || !novoEvento.titulo.trim()) return;
    try {
      await addEvento(novoEvento.data, novoEvento.titulo.trim(), novoEvento.descricao.trim() || undefined);
      setNovoEvento({ data: '', titulo: '', descricao: '' });
      setShowAddEvento(false);
    } catch (err) {
      console.error('Erro ao adicionar evento:', err);
    }
  }

  function navTo(newView: string) {
    setView(newView);
    setSidebarOpen(false);
  }

  // ─── Sidebar nav item ───
  function NavItem({
    id, icon, label, active,
  }: { id: string; icon: string; label: string; active: boolean }) {
    const isAreaItem = AREAS.some(a => a.id === id);
    const area = isAreaItem ? AREAS.find(a => a.id === id) : null;
    const cor = area?.cor && area.cor !== '#FFFFFF' ? area.cor : '#6B7280';

    return (
      <button
        onClick={() => navTo(id)}
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm w-full transition-all duration-150 group"
        style={{
          backgroundColor: active ? (area ? `${cor}15` : 'var(--bg-card-2)') : 'transparent',
          color: active ? (area ? cor : 'var(--text-primary)') : 'var(--text-secondary)',
          fontWeight: active ? 600 : 400,
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'var(--bg-card-2)'; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        {area ? (
          <span className="w-2 h-2 rounded-full flex-shrink-0 transition-transform group-hover:scale-110" style={{ backgroundColor: cor }} />
        ) : (
          <span className="text-base flex-shrink-0">{icon}</span>
        )}
        <span className="truncate">{label}</span>
      </button>
    );
  }

  function SidebarContent() {
    return (
      <>
        {/* Logo in sidebar */}
        <div className="px-2 pb-3 mb-1" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <button onClick={() => navTo('home')} className="bg-transparent border-0 p-0 cursor-pointer">
            <img src="/logo-connect.png" alt="Connect" style={{ height: '24px', width: 'auto' }} />
          </button>
        </div>

        <NavItem id="visao-geral" icon="📊" label="Visão Geral" active={view === 'visao-geral'} />
        <NavItem id="sobre" icon="ℹ️" label="Sobre" active={view === 'sobre'} />

        <div className="my-2" style={{ borderTop: '1px solid var(--border-color)' }} />

        <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-1" style={{ color: 'var(--text-muted)' }}>
          Áreas
        </p>

        {AREAS.map(area => (
          <NavItem
            key={area.id}
            id={area.id}
            icon={area.icone}
            label={area.nome}
            active={view === area.id}
          />
        ))}
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <Header
        user={user ? { email: user.email ?? '', nome: user.email ?? '' } : null}
        onLoginClick={() => navigate('/login')}
        onLogout={logout}
        theme={theme}
        onToggleTheme={toggleTheme}
        onNavTo={navTo}
        currentView={view}
        onStartTutorial={() => setShowTutorial(true)}
      />

      {/* Body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>

        {/* ─── Sidebar (desktop always visible, mobile as overlay) ─── */}
        {/* Mobile overlay backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 lg:hidden"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar panel */}
        <aside
          className="fixed lg:relative z-40 lg:z-auto flex flex-col h-full overflow-y-auto"
          style={{
            width: '200px',
            flexShrink: 0,
            backgroundColor: 'var(--bg-card)',
            borderRight: '1px solid var(--border-color)',
            padding: '16px 8px',
            gap: '2px',
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.25s ease',
            top: '56px',
            bottom: 0,
            left: 0,
          }}
        >
          <SidebarContent />
        </aside>

        {/* Desktop sidebar (always visible, no transform) */}
        <aside
          className="hidden lg:flex flex-col overflow-y-auto flex-shrink-0"
          style={{
            width: '200px',
            backgroundColor: 'var(--bg-card)',
            borderRight: '1px solid var(--border-color)',
            padding: '16px 8px',
            gap: '2px',
          }}
        >
          <SidebarContent />
        </aside>

        {/* ─── Main content ─── */}
        <main className="flex-1 overflow-y-auto" style={{ minWidth: 0 }}>
          {/* Mobile: hamburger bar */}
          <div
            className="lg:hidden flex items-center gap-3 px-4 py-3 sticky top-0 z-10"
            style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}
          >
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg"
              style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <line x1="2" y1="4" x2="14" y2="4" />
                <line x1="2" y1="8" x2="14" y2="8" />
                <line x1="2" y1="12" x2="14" y2="12" />
              </svg>
            </button>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {selectedArea ? selectedArea.nome : view === 'visao-geral' ? 'Visão Geral' : view === 'sobre' ? 'Sobre' : 'Escalas de Produção'}
            </span>
          </div>

          <div className="px-6 py-6 max-w-4xl mx-auto w-full">
            {/* ─── AREA PANEL ─── */}
            {selectedArea ? (
              <AreaPanel
                key={view}
                area={selectedArea}
                isAuthenticated={isAuthenticated}
                user={user ? { email: user.email ?? '' } : null}
              />
            ) : view === 'visao-geral' ? (
              /* ─── VISÃO GERAL PANEL ─── */
              <VisaoGeralPanel />
            ) : view === 'sobre' ? (
              /* ─── SOBRE PANEL ─── */
              <SobrePanel onSelectArea={navTo} />
            ) : (
              /* ─── HOME: ESCALAS DE PRODUÇÃO ─── */
              <div>
                {/* Title + month nav + add button */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <div>
                    <h1 className="font-black text-xl tracking-tight uppercase" style={{ color: 'var(--text-primary)' }}>
                      Escalas de Produção
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {MESES_PT[month - 1]} {year}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Month nav */}
                    <div className="flex items-center gap-1 rounded-xl px-3 py-2" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                      <button
                        onClick={prevMonth}
                        className="w-6 h-6 flex items-center justify-center rounded text-lg font-light transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                      >
                        ‹
                      </button>
                      <span className="text-xs font-semibold tracking-wider uppercase min-w-[80px] text-center" style={{ color: 'var(--text-primary)' }}>
                        {MESES_PT[month - 1].slice(0, 3)} {year}
                      </span>
                      <button
                        onClick={nextMonth}
                        className="w-6 h-6 flex items-center justify-center rounded text-lg font-light transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                      >
                        ›
                      </button>
                    </div>

                    {isAuthenticated && (
                      <button
                        onClick={() => setShowAddEvento(true)}
                        className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-opacity hover:opacity-90"
                        style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}
                      >
                        + Evento
                      </button>
                    )}
                  </div>
                </div>

                {/* Events */}
                {loading ? (
                  <div className="flex flex-col gap-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="skeleton rounded-2xl h-32" style={{ animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                ) : eventosSorted.length === 0 ? (
                  <div
                    className="rounded-2xl p-12 text-center"
                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                  >
                    <p className="text-4xl mb-4">📅</p>
                    <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Nenhum evento neste mês</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                      {isAuthenticated ? 'Clique em "+ Evento" para começar' : 'Navegue para outro mês'}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 stagger animate-fade-in">
                    {eventosSorted.map(evento => (
                      <div key={evento.id} className="group relative animate-fade-in">
                        <EventoCard evento={evento} escalas={escalas} areas={AREAS} />
                        {isAuthenticated && (
                          <button
                            onClick={() => setConfirmDelete(evento.id)}
                            className="absolute top-4 right-4 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity text-xs font-semibold px-2.5 py-1 rounded-lg"
                            style={{ color: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Tutorial */}
      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}

      {/* Modal: Adicionar Evento */}
      {showAddEvento && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowAddEvento(false); }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5 modal-content"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Novo Evento</h2>
              <button
                onClick={() => setShowAddEvento(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-xl"
                style={{ color: 'var(--text-secondary)' }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddEvento} className="flex flex-col gap-4">
              {[
                { key: 'data', label: 'Data', type: 'date', placeholder: '' },
                { key: 'titulo', label: 'Título', type: 'text', placeholder: 'Ex: Culto Regular' },
                { key: 'descricao', label: 'Descrição (opcional)', type: 'text', placeholder: 'Ex: Domingo, Especial...' },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{label}</label>
                  <input
                    type={type}
                    value={novoEvento[key as keyof NovoEventoForm]}
                    onChange={e => setNovoEvento(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    required={key !== 'descricao'}
                    className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-card-2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddEvento(false)}
                  className="flex-1 rounded-xl py-3 text-sm font-semibold"
                  style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl py-3 text-sm font-bold transition-opacity hover:opacity-90"
                  style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}
                >
                  Criar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar exclusão */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
          onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(null); }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5 modal-content"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <div>
              <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Excluir Evento</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Esta ação não pode ser desfeita.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-xl py-3 text-sm font-semibold"
                style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  try { await removeEvento(confirmDelete); await refreshEscalas(); } catch (err) { console.error(err); }
                  setConfirmDelete(null);
                }}
                className="flex-1 rounded-xl py-3 text-sm font-bold text-white"
                style={{ backgroundColor: '#EF4444' }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
