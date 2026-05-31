import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEventos } from '../hooks/useEventos';
import { useEscalas } from '../hooks/useEscalas';
import Header from '../components/layout/Header';
import AreaHeader from '../components/area/AreaHeader';
import EscalaCard from '../components/area/EscalaCard';
import EscalaForm from '../components/shared/EscalaForm';
import { AREAS } from '../constants/areas';
import type { Escala, Evento } from '../types';
import { getEventosByMonth } from '../lib/storage';

const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function AreaPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(6);
  const area = AREAS.find(a => a.id === slug);
  const { eventos, refresh: refreshEventos, loading: loadingEventos } = useEventos(year, month);
  const { escalas, saveEscala, removeEscala, refresh: refreshEscalas, loading: loadingEscalas } = useEscalas(area?.id);
  const [showForm, setShowForm] = useState(false);
  const [escalaEditando, setEscalaEditando] = useState<Escala | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [todosEventos, setTodosEventos] = useState<Evento[]>([]);

  useEffect(() => {
    refreshEventos();
    getEventosByMonth(year, month).then(setTodosEventos).catch(console.error);
  }, [refreshEventos, year, month]);

  if (!area) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
        <div className="text-center">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-white font-bold text-lg">Área não encontrada</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-gray-400 hover:text-white text-sm transition-colors underline"
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

  function handleEdit(escala: Escala) {
    setEscalaEditando(escala);
    setShowForm(true);
  }

  function handleDelete(id: string) {
    setConfirmDelete(id);
  }

  async function confirmDeleteEscala() {
    if (confirmDelete) {
      try {
        await removeEscala(confirmDelete);
      } catch (err) {
        console.error('Erro ao excluir escala:', err);
      }
      setConfirmDelete(null);
    }
  }

  function handleCloseForm() {
    setShowForm(false);
    setEscalaEditando(undefined);
  }

  const loading = loadingEventos || loadingEscalas;
  const eventosSorted = [...eventos].sort((a, b) => a.data.localeCompare(b.data));

  // Eventos que já têm escala nesta área
  const eventosComEscala = escalas
    .filter(e => eventosSorted.some(ev => ev.id === e.evento_id))
    .map(escala => {
      const evento = eventosSorted.find(ev => ev.id === escala.evento_id);
      return { escala, evento };
    })
    .filter(item => item.evento)
    .sort((a, b) => a.evento!.data.localeCompare(b.evento!.data));

  // Eventos sem escala nesta área
  const eventosSemEscala = eventosSorted.filter(
    ev => !escalas.some(e => e.evento_id === ev.id)
  );

  const cor = area.cor === '#FFFFFF' ? '#888888' : area.cor;

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

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Botão voltar */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-500 hover:text-white text-sm font-medium transition-colors mb-6 group"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          Dashboard
        </button>

        {/* Area Header */}
        <AreaHeader area={area} />

        {/* Título + botão */}
        <div className="flex items-center justify-between mt-8 mb-6 flex-wrap gap-3">
          <h2 className="text-white font-black text-lg tracking-tight uppercase">
            Escalas — {MESES_PT[month - 1]} {year}
          </h2>
          {isAuthenticated && (
            <button
              onClick={() => { setEscalaEditando(undefined); setShowForm(true); }}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-opacity hover:opacity-90"
              style={{
                backgroundColor: cor,
                color: area.cor === '#FFFFFF' ? '#ffffff' : '#000000',
              }}
            >
              + Adicionar Escala
            </button>
          )}
        </div>

        {/* Loading state */}
        {loading ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{ backgroundColor: '#1A1A1A', border: '1px solid #333333' }}
          >
            <p className="text-gray-500 font-semibold">Carregando...</p>
          </div>
        ) : (
          /* Lista de escalas */
          <div className="flex flex-col gap-4">
            {/* Escalas preenchidas */}
            {eventosComEscala.map(({ escala, evento }) => (
              <EscalaCard
                key={escala.id}
                escala={escala}
                evento={evento!}
                area={area}
                isAuthenticated={isAuthenticated}
                onEdit={() => handleEdit(escala)}
                onDelete={() => handleDelete(escala.id)}
              />
            ))}

            {/* Eventos sem escala */}
            {eventosSemEscala.map(evento => {
              const d = new Date(evento.data + 'T00:00:00');
              const dataFmt = d.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                weekday: 'long',
              });
              return (
                <div
                  key={evento.id}
                  className="rounded-2xl p-5 flex items-center justify-between gap-4"
                  style={{ backgroundColor: '#1A1A1A', border: '1px dashed #333333' }}
                >
                  <div>
                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider capitalize">
                      {dataFmt}
                    </p>
                    <p className="text-gray-400 font-semibold mt-0.5">{evento.titulo}</p>
                    <p className="text-gray-600 text-xs mt-1 italic">Não preenchido</p>
                  </div>
                  {isAuthenticated && (
                    <button
                      onClick={() => {
                        setEscalaEditando({
                          id: '',
                          evento_id: evento.id,
                          area_id: area.id,
                          voluntarios: [],
                        });
                        setShowForm(true);
                      }}
                      className="flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-xl transition-opacity hover:opacity-80"
                      style={{
                        backgroundColor: `${cor}20`,
                        border: `1px solid ${cor}40`,
                        color: cor,
                      }}
                    >
                      Preencher
                    </button>
                  )}
                </div>
              );
            })}

            {/* Empty state */}
            {eventosSorted.length === 0 && (
              <div
                className="rounded-2xl p-12 text-center"
                style={{ backgroundColor: '#1A1A1A', border: '1px solid #333333' }}
              >
                <p className="text-4xl mb-4">📅</p>
                <p className="text-gray-400 font-semibold">Nenhum evento neste mês</p>
                <p className="text-gray-600 text-sm mt-1">Navegue para outro mês ou cadastre eventos no Dashboard</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: EscalaForm */}
      {showForm && (
        <EscalaForm
          eventos={todosEventos}
          areaId={area.id}
          areaCor={area.cor}
          areaNome={area.nome}
          escalaExistente={escalaEditando?.id ? escalaEditando : undefined}
          onSave={async (data) => {
            try {
              await saveEscala(data);
              await refreshEscalas();
            } catch (err) {
              console.error('Erro ao salvar escala:', err);
            }
          }}
          onClose={handleCloseForm}
          user={user ? { email: user.email ?? '', nome: user.email ?? '' } : null}
        />
      )}

      {/* Modal: Confirmar exclusão */}
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
              <h2 className="text-white font-bold text-lg">Excluir Escala</h2>
              <p className="text-gray-400 text-sm mt-1">Esta ação não pode ser desfeita.</p>
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
                onClick={confirmDeleteEscala}
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
