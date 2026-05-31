import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEventos } from '../hooks/useEventos';
import { useEscalas } from '../hooks/useEscalas';
import { useTheme } from '../hooks/useTheme';
import Header from '../components/layout/Header';
import EventoCard from '../components/dashboard/EventoCard';
import AreaPanel from '../components/area/AreaPanel';
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

  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(6);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const { eventos, addEvento, removeEvento, refresh: refreshEventos, loading: loadingEventos } = useEventos(year, month);
  const { escalas, refresh: refreshEscalas, loading: loadingEscalas } = useEscalas();
  const [showAddEvento, setShowAddEvento] = useState(false);
  const [novoEvento, setNovoEvento] = useState<NovoEventoForm>({ data: '', titulo: '', descricao: '' });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => { refreshEventos(); }, [refreshEventos]);

  const selectedArea = selectedAreaId ? AREAS.find(a => a.id === selectedAreaId) ?? null : null;

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

  const loading = loadingEventos || loadingEscalas;
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

      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-6">
        {/* Sidebar */}
        <aside className="w-52 flex-shrink-0 hidden lg:block">
          <div
            className="rounded-2xl p-3 sticky top-24"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            {/* Navigation */}
            <button
              onClick={() => { setSelectedAreaId(null); navigate('/visao-geral'); }}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm font-semibold w-full transition-all duration-150 mb-1"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-card-2)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span className="text-base">📊</span>
              Visão Geral
            </button>
            <button
              onClick={() => { setSelectedAreaId(null); navigate('/sobre'); }}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm font-medium w-full transition-all duration-150 mb-3"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-card-2)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span className="text-base">ℹ️</span>
              Sobre
            </button>

            {/* Divider */}
            <div className="mb-3" style={{ borderTop: '1px solid var(--border-color)' }} />

            <p className="text-xs font-semibold uppercase tracking-widest mb-2 px-3" style={{ color: 'var(--text-muted)' }}>
              Áreas
            </p>
            <nav className="flex flex-col gap-0.5">
              {AREAS.map(area => {
                const isActive = selectedAreaId === area.id;
                const cor = area.cor === '#FFFFFF' ? '#888888' : area.cor;
                return (
                  <button
                    key={area.id}
                    onClick={() => setSelectedAreaId(isActive ? null : area.id)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm w-full transition-all duration-150 group"
                    style={{
                      backgroundColor: isActive ? `${cor}18` : 'transparent',
                      color: isActive ? cor : 'var(--text-secondary)',
                      fontWeight: isActive ? 600 : 400,
                    }}
                    onMouseEnter={e => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-card-2)';
                    }}
                    onMouseLeave={e => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: cor }}
                    />
                    <span className="truncate">{area.nome}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Panel */}
        <main className="flex-1 min-w-0 animate-fade-in">
          {selectedArea ? (
            /* ─── AREA PANEL ─── */
            <div>
              {/* Back button */}
              <button
                onClick={() => setSelectedAreaId(null)}
                className="flex items-center gap-1.5 text-sm font-medium mb-5 transition-all group"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                <span className="group-hover:-translate-x-0.5 transition-transform inline-block">←</span>
                Escalas de Produção
              </button>
              <AreaPanel
                area={selectedArea}
                year={year}
                month={month}
                eventos={eventosSorted}
                isAuthenticated={isAuthenticated}
                user={user ? { email: user.email ?? '' } : null}
              />
            </div>
          ) : (
            /* ─── EVENTOS OVERVIEW ─── */
            <div>
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                  <h1 className="font-black text-xl tracking-tight uppercase" style={{ color: 'var(--text-primary)' }}>
                    Escalas de Produção
                  </h1>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {MESES_PT[month - 1]} {year}
                  </p>
                </div>
                {isAuthenticated && (
                  <button
                    onClick={() => setShowAddEvento(true)}
                    className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-opacity hover:opacity-90"
                    style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}
                  >
                    + Adicionar Evento
                  </button>
                )}
              </div>

              {/* Mobile: area chips */}
              <div className="lg:hidden flex gap-2 flex-wrap mb-5">
                <button
                  onClick={() => navigate('/visao-geral')}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
                  style={{ backgroundColor: 'var(--bg-card-2)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                >
                  📊 Visão Geral
                </button>
                <button
                  onClick={() => navigate('/sobre')}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                  style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                >
                  ℹ️ Sobre
                </button>
                {AREAS.map(area => (
                  <button
                    key={area.id}
                    onClick={() => navigate(`/area/${area.id}`)}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                    style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: area.cor === '#FFFFFF' ? '#888' : area.cor }} />
                    {area.nome}
                  </button>
                ))}
              </div>

              {/* Loading */}
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
                    {isAuthenticated ? 'Clique em "+ Adicionar Evento" para começar' : 'Navegue para outro mês'}
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
                          className="absolute top-4 right-4 lg:opacity-0 lg:group-hover:opacity-100 opacity-100 transition-opacity text-xs font-semibold px-2.5 py-1 rounded-lg"
                          style={{
                            color: '#EF4444',
                            backgroundColor: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.2)',
                          }}
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
        </main>
      </div>

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
                className="w-8 h-8 flex items-center justify-center rounded-lg text-xl transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-card-2)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddEvento} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Data</label>
                <input
                  type="date"
                  value={novoEvento.data}
                  onChange={e => setNovoEvento(p => ({ ...p, data: e.target.value }))}
                  required
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-card-2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Título</label>
                <input
                  type="text"
                  value={novoEvento.titulo}
                  onChange={e => setNovoEvento(p => ({ ...p, titulo: e.target.value }))}
                  placeholder="Ex: Culto Regular"
                  required
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-card-2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Descrição (opcional)</label>
                <input
                  type="text"
                  value={novoEvento.descricao}
                  onChange={e => setNovoEvento(p => ({ ...p, descricao: e.target.value }))}
                  placeholder="Ex: Domingo, Especial..."
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-card-2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddEvento(false)}
                  className="flex-1 rounded-xl py-3 text-sm font-semibold transition-colors"
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

      {/* Modal: Confirmar exclusão de evento */}
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
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Esta ação não pode ser desfeita. As escalas associadas serão mantidas.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-xl py-3 text-sm font-semibold transition-colors"
                style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  try {
                    await removeEvento(confirmDelete);
                    await refreshEscalas();
                  } catch (err) {
                    console.error('Erro ao excluir evento:', err);
                  }
                  setConfirmDelete(null);
                }}
                className="flex-1 rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
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
