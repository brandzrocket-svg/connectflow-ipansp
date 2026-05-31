import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEventos } from '../hooks/useEventos';
import { useEscalas } from '../hooks/useEscalas';
import { useTheme } from '../hooks/useTheme';
import { useVoluntarios } from '../hooks/useVoluntarios';
import Header from '../components/layout/Header';
import AreaHeader from '../components/area/AreaHeader';
import EscalaCard from '../components/area/EscalaCard';
import EscalaForm from '../components/shared/EscalaForm';
import { AREAS } from '../constants/areas';
import type { Escala, Evento } from '../types';
import { getEventosByMonth, createReport } from '../lib/storage';

const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function AreaPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(6);
  const area = AREAS.find(a => a.id === slug);
  const { eventos, refresh: refreshEventos, loading: loadingEventos } = useEventos(year, month);
  const { escalas, saveEscala, removeEscala, refresh: refreshEscalas, loading: loadingEscalas } = useEscalas(area?.id);
  const { voluntarios, addVoluntario, removeVoluntario } = useVoluntarios(area?.id ?? '');
  const [showForm, setShowForm] = useState(false);
  const [escalaEditando, setEscalaEditando] = useState<Escala | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [todosEventos, setTodosEventos] = useState<Evento[]>([]);
  const [reportMensagem, setReportMensagem] = useState('');
  const [reportEnviado, setReportEnviado] = useState(false);
  const [reportEnviando, setReportEnviando] = useState(false);
  const [novoVoluntario, setNovoVoluntario] = useState('');
  const [adicionandoVoluntario, setAdicionandoVoluntario] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    refreshEventos();
    getEventosByMonth(year, month).then(setTodosEventos).catch(console.error);
  }, [refreshEventos, year, month]);

  if (!area) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
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

  async function handleAddVoluntario(e: React.FormEvent) {
    e.preventDefault()
    const nome = novoVoluntario.trim()
    if (!nome) return
    setAdicionandoVoluntario(true)
    await addVoluntario(nome)
    setNovoVoluntario('')
    setAdicionandoVoluntario(false)
  }

  async function handleEnviarReport(e: React.FormEvent) {
    e.preventDefault();
    if (!reportMensagem.trim() || !isAuthenticated || !area) return;
    setReportEnviando(true);
    try {
      await createReport({
        area_id: area!.id,
        mensagem: reportMensagem.trim(),
        criado_por: user?.email ?? 'anon',
      });
      setReportMensagem('');
      setReportEnviado(true);
      setTimeout(() => setReportEnviado(false), 3000);
    } catch (err) {
      console.error('Erro ao enviar report:', err);
    }
    setReportEnviando(false);
  }

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
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
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
                  style={{ backgroundColor: 'var(--bg-card)', border: '1px dashed var(--border-color)' }}
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
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
              >
                <p className="text-4xl mb-4">📅</p>
                <p className="text-gray-400 font-semibold">Nenhum evento neste mês</p>
                <p className="text-gray-600 text-sm mt-1">Navegue para outro mês ou cadastre eventos no Dashboard</p>
              </div>
            )}
          </div>
        )}

        {/* Seção de Voluntários */}
        <div className="mt-8 rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cor }} />
            <h3 className="font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Voluntários da Área
            </h3>
            <span className="text-xs ml-auto" style={{ color: 'var(--text-secondary)' }}>
              {voluntarios.length} cadastrado{voluntarios.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Lista */}
          <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
            {voluntarios.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Nenhum voluntário cadastrado.</p>
            ) : voluntarios.map(v => (
              <div
                key={v.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                style={{ backgroundColor: 'var(--bg-card-2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cor }} />
                {v.nome}
                {isAuthenticated && (
                  <button
                    onClick={() => removeVoluntario(v.id)}
                    className="ml-1 text-gray-500 hover:text-red-400 transition-colors text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Form de adição */}
          {isAuthenticated && (
            <form onSubmit={handleAddVoluntario} className="flex gap-2">
              <input
                type="text"
                value={novoVoluntario}
                onChange={e => setNovoVoluntario(e.target.value)}
                placeholder="Nome do voluntário..."
                className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                style={{ backgroundColor: 'var(--bg-card-2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
              <button
                type="submit"
                disabled={adicionandoVoluntario || !novoVoluntario.trim()}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-black disabled:opacity-50 transition-opacity hover:opacity-90"
                style={{ backgroundColor: cor }}
              >
                + Adicionar
              </button>
            </form>
          )}
        </div>

        {/* Seção: Reportar para o Líder */}
        {isAuthenticated && (
          <div
            className="mt-10 rounded-2xl p-5 flex flex-col gap-4"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: `1px solid ${cor}40`,
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: cor }}
              />
              <h2 className="text-white font-black text-sm tracking-widest uppercase">
                Reportar para o Líder
              </h2>
            </div>
            <form onSubmit={handleEnviarReport} className="flex flex-col gap-3">
              <textarea
                value={reportMensagem}
                onChange={e => setReportMensagem(e.target.value)}
                placeholder="Descreva uma observação, necessidade ou ocorrência desta área..."
                rows={3}
                className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none resize-none"
                style={{
                  backgroundColor: 'var(--bg-card-2)',
                  border: `1px solid ${cor}30`,
                }}
              />
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={!reportMensagem.trim() || reportEnviando}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: cor, color: area.cor === '#FFFFFF' ? '#111' : '#000' }}
                >
                  {reportEnviando ? 'Enviando...' : 'Enviar Report'}
                </button>
                {reportEnviado && (
                  <span className="text-green-400 text-sm font-semibold animate-pulse">
                    Report enviado com sucesso!
                  </span>
                )}
              </div>
            </form>
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
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <div>
              <h2 className="text-white font-bold text-lg">Excluir Escala</h2>
              <p className="text-gray-400 text-sm mt-1">Esta ação não pode ser desfeita.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-xl py-3 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
                style={{ border: '1px solid var(--border-color)' }}
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
