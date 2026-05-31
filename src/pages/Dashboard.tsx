import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEventos } from '../hooks/useEventos';
import { useEscalas } from '../hooks/useEscalas';
import Header from '../components/layout/Header';
import EventoCard from '../components/dashboard/EventoCard';
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

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, navigate]);
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(6);
  const { eventos, addEvento, removeEvento, refresh: refreshEventos, loading: loadingEventos } = useEventos(year, month);
  const { escalas, refresh: refreshEscalas, loading: loadingEscalas } = useEscalas();
  const [showAddEvento, setShowAddEvento] = useState(false);
  const [novoEvento, setNovoEvento] = useState<NovoEventoForm>({ data: '', titulo: '', descricao: '' });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Refresh quando mudar o mês/ano
  useEffect(() => {
    refreshEventos();
  }, [refreshEventos]);

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
    <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
      <Header
        mes={month}
        ano={year}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
        user={user ? { email: user.email ?? '', nome: user.email ?? '' } : null}
        onLoginClick={() => navigate('/login')}
        onLogout={logout}
      />

      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 hidden lg:block">
          <div
            className="rounded-2xl p-4 sticky top-24"
            style={{ backgroundColor: '#1A1A1A', border: '1px solid #333333' }}
          >
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-4 px-2">
              Áreas
            </p>
            <nav className="flex flex-col gap-1">
              {AREAS.map(area => (
                <button
                  key={area.id}
                  onClick={() => navigate(`/area/${area.id}`)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-150 group"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: area.cor }}
                  />
                  <span className="font-medium truncate">{area.nome}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          {/* Título */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-white font-black text-xl tracking-tight uppercase">
                Escalas de Produção
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {MESES_PT[month - 1]} {year}
              </p>
            </div>
            {isAuthenticated && (
              <button
                onClick={() => setShowAddEvento(true)}
                className="flex items-center gap-2 text-sm font-semibold text-black px-4 py-2 rounded-xl transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#FFFFFF' }}
              >
                + Adicionar Evento
              </button>
            )}
          </div>

          {/* Mobile: área links */}
          <div className="lg:hidden flex gap-2 flex-wrap mb-6">
            {AREAS.map(area => (
              <button
                key={area.id}
                onClick={() => navigate(`/area/${area.id}`)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full text-gray-300 hover:text-white transition-colors"
                style={{ backgroundColor: '#1A1A1A', border: '1px solid #333333' }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: area.cor }} />
                {area.nome}
              </button>
            ))}
          </div>

          {/* Loading state */}
          {loading ? (
            <div
              className="rounded-2xl p-12 text-center"
              style={{ backgroundColor: '#1A1A1A', border: '1px solid #333333' }}
            >
              <p className="text-gray-500 font-semibold">Carregando...</p>
            </div>
          ) : eventosSorted.length === 0 ? (
            <div
              className="rounded-2xl p-12 text-center"
              style={{ backgroundColor: '#1A1A1A', border: '1px solid #333333' }}
            >
              <p className="text-4xl mb-4">📅</p>
              <p className="text-gray-400 font-semibold">Nenhum evento cadastrado neste mês</p>
              <p className="text-gray-600 text-sm mt-1">
                {isAuthenticated ? 'Clique em "+ Adicionar Evento" para começar' : 'Navegue para outro mês ou faça login para adicionar eventos'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {eventosSorted.map(evento => (
                <div key={evento.id} className="group relative">
                  <EventoCard evento={evento} escalas={escalas} areas={AREAS} />
                  {isAuthenticated && (
                    <button
                      onClick={() => setConfirmDelete(evento.id)}
                      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 text-xs font-semibold px-2.5 py-1 rounded-lg"
                      style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                      Excluir
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal: Adicionar Evento */}
      {showAddEvento && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowAddEvento(false); }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
            style={{ backgroundColor: '#1A1A1A', border: '1px solid #333333' }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">Novo Evento</h2>
              <button
                onClick={() => setShowAddEvento(false)}
                className="text-gray-500 hover:text-white transition-colors text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddEvento} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Data</label>
                <input
                  type="date"
                  value={novoEvento.data}
                  onChange={e => setNovoEvento(p => ({ ...p, data: e.target.value }))}
                  required
                  className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
                  style={{ backgroundColor: '#2A2A2A', border: '1px solid #333333', colorScheme: 'dark' }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Título</label>
                <input
                  type="text"
                  value={novoEvento.titulo}
                  onChange={e => setNovoEvento(p => ({ ...p, titulo: e.target.value }))}
                  placeholder="Ex: Culto Regular"
                  required
                  className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none"
                  style={{ backgroundColor: '#2A2A2A', border: '1px solid #333333' }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Descrição (opcional)</label>
                <input
                  type="text"
                  value={novoEvento.descricao}
                  onChange={e => setNovoEvento(p => ({ ...p, descricao: e.target.value }))}
                  placeholder="Ex: Domingo, Especial..."
                  className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none"
                  style={{ backgroundColor: '#2A2A2A', border: '1px solid #333333' }}
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddEvento(false)}
                  className="flex-1 rounded-xl py-3 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
                  style={{ border: '1px solid #333333' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl py-3 text-sm font-bold text-black transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#FFFFFF' }}
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
          onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(null); }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5"
            style={{ backgroundColor: '#1A1A1A', border: '1px solid #333333' }}
          >
            <div>
              <h2 className="text-white font-bold text-lg">Excluir Evento</h2>
              <p className="text-gray-400 text-sm mt-1">Esta ação não pode ser desfeita. As escalas associadas serão mantidas.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-xl py-3 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
                style={{ border: '1px solid #333333' }}
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
