import { useState } from 'react';
import { useEventos } from '../../hooks/useEventos';
import { useEscalas } from '../../hooks/useEscalas';
import { useVoluntarios } from '../../hooks/useVoluntarios';
import type { Area } from '../../types';
import { createReport } from '../../lib/storage';

const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

interface AreaPanelProps {
  area: Area;
  isAuthenticated: boolean;
  user: { email: string } | null;
}

export default function AreaPanel({ area, isAuthenticated, user }: AreaPanelProps) {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(6);

  const { eventos, loading: loadingEventos } = useEventos(year, month);
  const { escalas, saveEscala, removeEscala, refresh: refreshEscalas, loading: loadingEscalas } = useEscalas(area.id);
  const { voluntarios, error: voluntarioError, addVoluntario, removeVoluntario } = useVoluntarios(area.id);

  // Inline checklist states
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draftVols, setDraftVols] = useState<Record<string, string[]>>({});
  const [draftObs, setDraftObs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [reportMensagem, setReportMensagem] = useState('');
  const [reportEnviado, setReportEnviado] = useState(false);
  const [reportEnviando, setReportEnviando] = useState(false);
  const [sugestaoMensagem, setSugestaoMensagem] = useState('');
  const [sugestaoEnviada, setSugestaoEnviada] = useState(false);
  const [novoVoluntario, setNovoVoluntario] = useState('');
  const [adicionandoVoluntario, setAdicionandoVoluntario] = useState(false);

  const cor = area.cor === '#FFFFFF' ? '#888888' : area.cor;
  const eventosSorted = [...eventos].sort((a, b) => a.data.localeCompare(b.data));

  const loading = loadingEventos || loadingEscalas;

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  function handleOpen(eventoId: string) {
    if (expandedId === eventoId) {
      setExpandedId(null);
      return;
    }
    const escalaExistente = escalas.find(e => e.evento_id === eventoId);
    setDraftVols(prev => ({
      ...prev,
      [eventoId]: escalaExistente?.voluntarios ? [...escalaExistente.voluntarios] : [],
    }));
    setDraftObs(prev => ({
      ...prev,
      [eventoId]: escalaExistente?.observacao ?? '',
    }));
    setExpandedId(eventoId);
  }

  function toggleVol(eventoId: string, nome: string) {
    setDraftVols(prev => {
      const current = prev[eventoId] ?? [];
      const next = current.includes(nome)
        ? current.filter(n => n !== nome)
        : [...current, nome];
      return { ...prev, [eventoId]: next };
    });
  }

  async function saveInline(eventoId: string) {
    setSaving(eventoId);
    try {
      await saveEscala({
        evento_id: eventoId,
        area_id: area.id,
        voluntarios: draftVols[eventoId] ?? [],
        observacao: draftObs[eventoId] ?? '',
        criado_por: user?.email,
      });
      await refreshEscalas();
      setExpandedId(null);
    } catch (err) {
      console.error('Erro ao salvar escala:', err);
    }
    setSaving(null);
  }

  async function handleAddVoluntario(e: React.FormEvent) {
    e.preventDefault();
    const nome = novoVoluntario.trim();
    if (!nome) return;
    setAdicionandoVoluntario(true);
    await addVoluntario(nome);
    setNovoVoluntario('');
    setAdicionandoVoluntario(false);
  }

  async function handleEnviarReport(e: React.FormEvent) {
    e.preventDefault();
    if (!reportMensagem.trim() || !isAuthenticated) return;
    setReportEnviando(true);
    try {
      await createReport({
        area_id: area.id,
        mensagem: `[REPORT] ${reportMensagem.trim()}`,
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

  async function handleEnviarSugestao(e: React.FormEvent) {
    e.preventDefault();
    if (!sugestaoMensagem.trim()) return;
    try {
      await createReport({
        area_id: area.id,
        mensagem: `[SUGESTÃO] ${sugestaoMensagem.trim()}`,
        criado_por: user?.email ?? 'voluntário',
      });
      setSugestaoMensagem('');
      setSugestaoEnviada(true);
      setTimeout(() => setSugestaoEnviada(false), 3000);
    } catch (err) {
      console.error('Erro ao enviar sugestão:', err);
    }
  }

  return (
    <div className="animate-fade-in">
      {/* ─── Area header + month nav ─── */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cor }} />
        <div className="flex-1 min-w-0">
          <h2 className="font-black text-xl tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {area.nome}
          </h2>
          <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Co-líder: {area.colider}
          </p>
        </div>

        {/* Month nav */}
        <div className="flex items-center gap-1.5 rounded-xl px-3 py-2" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <button
            onClick={prevMonth}
            className="w-6 h-6 flex items-center justify-center rounded text-lg font-light transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            ‹
          </button>
          <span className="text-xs font-semibold tracking-wider uppercase min-w-[90px] text-center" style={{ color: 'var(--text-primary)' }}>
            {MESES_PT[month - 1]} {year}
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
      </div>

      {/* ─── Escalas (inline expand) ─── */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton rounded-2xl h-16" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2 stagger">
          {eventosSorted.length === 0 && (
            <div
              className="rounded-2xl p-10 text-center"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              <p className="text-3xl mb-3">📅</p>
              <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Nenhum evento neste mês</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Cadastre eventos no início do Dashboard</p>
            </div>
          )}

          {eventosSorted.map(evento => {
            const escala = escalas.find(e => e.evento_id === evento.id);
            const isOpen = expandedId === evento.id;
            const d = new Date(evento.data + 'T00:00:00');
            const diaNum = d.getDate();
            const mesAbrev = MESES_PT[d.getMonth()].slice(0, 3).toUpperCase();
            const diaSem = DIAS_SEMANA[d.getDay()];
            const volCount = escala?.voluntarios?.length ?? 0;
            const volDraft = draftVols[evento.id] ?? [];

            return (
              <div
                key={evento.id}
                className="overflow-hidden"
                style={{
                  borderRadius: isOpen ? '16px 16px 16px 16px' : '16px',
                  border: `1px solid ${isOpen ? cor + '50' : 'var(--border-color)'}`,
                  backgroundColor: 'var(--bg-card)',
                  transition: 'border-color 0.2s ease',
                }}
              >
                {/* Row header */}
                <button
                  onClick={() => handleOpen(evento.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  style={{ cursor: 'pointer', background: 'none' }}
                >
                  {/* Date badge */}
                  <div
                    className="flex-shrink-0 flex flex-col items-center justify-center rounded-xl"
                    style={{
                      width: '44px',
                      height: '44px',
                      backgroundColor: isOpen ? `${cor}20` : 'var(--bg-card-2)',
                      border: `1px solid ${isOpen ? cor + '40' : 'var(--border-color)'}`,
                      transition: 'background-color 0.2s ease, border-color 0.2s ease',
                    }}
                  >
                    <span className="font-black leading-none text-lg" style={{ color: isOpen ? cor : 'var(--text-primary)' }}>{diaNum}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider leading-none mt-0.5" style={{ color: isOpen ? cor + 'bb' : 'var(--text-muted)' }}>{mesAbrev}</span>
                  </div>

                  {/* Divider */}
                  <div className="w-px self-stretch mx-1" style={{ backgroundColor: 'var(--border-color)' }} />

                  {/* Middle info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{diaSem}</p>
                    <p className="font-semibold text-sm truncate mt-0.5" style={{ color: 'var(--text-primary)' }}>{evento.titulo}</p>
                    {escala ? (
                      <p className="text-xs mt-0.5" style={{ color: cor }}>
                        {volCount} voluntário{volCount !== 1 ? 's' : ''} escalado{volCount !== 1 ? 's' : ''}
                      </p>
                    ) : (
                      <p className="text-xs mt-0.5 italic" style={{ color: 'var(--text-muted)' }}>Sem escala</p>
                    )}
                  </div>

                  {/* Right: chevron + delete */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isAuthenticated && escala && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setConfirmDelete(escala.id);
                        }}
                        className="w-6 h-6 flex items-center justify-center rounded-lg text-xs font-bold transition-colors"
                        style={{ color: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                        title="Excluir escala"
                      >
                        ✕
                      </button>
                    )}
                    <span
                      className="text-base transition-transform duration-200"
                      style={{
                        color: 'var(--text-muted)',
                        display: 'inline-block',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    >
                      ▾
                    </span>
                  </div>
                </button>

                {/* Expanded checklist */}
                {isOpen && (
                  <div
                    style={{
                      borderTop: `1px solid ${cor}30`,
                      backgroundColor: 'var(--bg-card-2)',
                      padding: '16px',
                    }}
                  >
                    {voluntarios.length === 0 ? (
                      <p className="text-sm italic mb-3" style={{ color: 'var(--text-muted)' }}>
                        Nenhum voluntário cadastrado nesta área.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2 mb-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                          Voluntários
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {voluntarios.map(v => {
                            const checked = volDraft.includes(v.nome);
                            if (!isAuthenticated) {
                              // Read-only: just show names
                              const inEscala = escala?.voluntarios?.includes(v.nome) ?? false;
                              if (!inEscala) return null;
                              return (
                                <span
                                  key={v.id}
                                  className="px-3 py-1.5 rounded-full text-xs font-semibold"
                                  style={{
                                    backgroundColor: `${cor}20`,
                                    border: `1px solid ${cor}40`,
                                    color: cor,
                                  }}
                                >
                                  {v.nome}
                                </span>
                              );
                            }
                            return (
                              <label
                                key={v.id}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer select-none transition-all"
                                style={{
                                  backgroundColor: checked ? `${cor}20` : 'var(--bg-card)',
                                  border: `1px solid ${checked ? cor + '60' : 'var(--border-color)'}`,
                                  color: checked ? cor : 'var(--text-secondary)',
                                }}
                              >
                                {/* Visual checkbox */}
                                <span
                                  className="flex-shrink-0 flex items-center justify-center rounded"
                                  style={{
                                    width: '14px',
                                    height: '14px',
                                    backgroundColor: checked ? cor : 'transparent',
                                    border: `1.5px solid ${checked ? cor : 'var(--border-color)'}`,
                                    transition: 'background-color 0.15s ease, border-color 0.15s ease',
                                  }}
                                >
                                  {checked && (
                                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                                      <path d="M1 3L3 5L7 1" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                </span>
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={checked}
                                  onChange={() => toggleVol(evento.id, v.nome)}
                                />
                                {v.nome}
                              </label>
                            );
                          })}
                        </div>
                        {!isAuthenticated && (escala?.voluntarios?.length ?? 0) === 0 && (
                          <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>Nenhum voluntário escalado.</p>
                        )}
                      </div>
                    )}

                    {/* Observação field (auth only) */}
                    {isAuthenticated && (
                      <div className="mb-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Observação</p>
                        <textarea
                          value={draftObs[evento.id] ?? ''}
                          onChange={e => setDraftObs(prev => ({ ...prev, [evento.id]: e.target.value }))}
                          placeholder="Observações sobre esta escala..."
                          rows={2}
                          className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none resize-none"
                          style={{
                            backgroundColor: 'var(--bg-card)',
                            border: `1px solid ${cor}30`,
                            color: 'var(--text-primary)',
                          }}
                        />
                      </div>
                    )}

                    {/* Observação read-only */}
                    {!isAuthenticated && escala?.observacao && (
                      <div className="mb-4 rounded-xl px-3 py-2 text-sm" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>Observação</span>
                        {escala.observacao}
                      </div>
                    )}

                    {/* Save/Cancel (auth only) */}
                    {isAuthenticated && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveInline(evento.id)}
                          disabled={saving === evento.id}
                          className="px-4 py-2 rounded-xl text-xs font-bold transition-opacity disabled:opacity-50"
                          style={{ backgroundColor: cor, color: '#000' }}
                        >
                          {saving === evento.id ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button
                          onClick={() => setExpandedId(null)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold"
                          style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Voluntários ─── */}
      <div id="voluntarios-section" className="mt-6 rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cor }} />
          <h3 className="font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
            Voluntários
          </h3>
          <span className="text-xs ml-auto" style={{ color: 'var(--text-secondary)' }}>
            {voluntarios.length} cadastrado{voluntarios.length !== 1 ? 's' : ''}
          </span>
        </div>

        {voluntarioError && (
          <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ color: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {voluntarioError}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-4 min-h-[28px]">
          {voluntarios.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Nenhum voluntário cadastrado.</p>
          ) : voluntarios.map(v => (
            <div
              key={v.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ backgroundColor: 'var(--bg-card-2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cor }} />
              {v.nome}
              {isAuthenticated && (
                <button
                  onClick={() => removeVoluntario(v.id)}
                  className="ml-1 text-xs transition-colors hover:text-red-400"
                  style={{ color: 'var(--text-muted)' }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

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
              className="px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-opacity hover:opacity-90"
              style={{ backgroundColor: cor, color: '#000' }}
            >
              + Adicionar
            </button>
          </form>
        )}
      </div>

      {/* ─── Reportar para o Líder ─── */}
      {isAuthenticated && (
        <div
          id="report-section"
          className="mt-4 rounded-2xl p-5 flex flex-col gap-4"
          style={{ backgroundColor: 'var(--bg-card)', border: `1px solid ${cor}40` }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cor }} />
            <h3 className="font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Reportar para o Líder
            </h3>
          </div>
          <form onSubmit={handleEnviarReport} className="flex flex-col gap-3">
            <textarea
              value={reportMensagem}
              onChange={e => setReportMensagem(e.target.value)}
              placeholder="Descreva uma observação, necessidade ou ocorrência desta área..."
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none resize-none"
              style={{ backgroundColor: 'var(--bg-card-2)', border: `1px solid ${cor}30`, color: 'var(--text-primary)' }}
            />
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={!reportMensagem.trim() || reportEnviando}
                className="px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 transition-opacity hover:opacity-90"
                style={{ backgroundColor: cor, color: '#000' }}
              >
                {reportEnviando ? 'Enviando...' : 'Enviar Report'}
              </button>
              {reportEnviado && (
                <span className="text-sm font-semibold" style={{ color: '#22C55E' }}>
                  Report enviado!
                </span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ─── Sugestões de Melhoria ─── */}
      <div
        id="sugestao-section"
        className="mt-4 rounded-2xl p-5 flex flex-col gap-4"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">💡</span>
          <h3 className="font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
            Sugestões de Melhoria
          </h3>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Tem uma ideia para melhorar esta área ou o app? Compartilhe!
        </p>
        <form onSubmit={handleEnviarSugestao} className="flex flex-col gap-3">
          <textarea
            value={sugestaoMensagem}
            onChange={e => setSugestaoMensagem(e.target.value)}
            placeholder="Descreva sua ideia ou sugestão de melhoria..."
            rows={2}
            className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none resize-none"
            style={{ backgroundColor: 'var(--bg-card-2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={!sugestaoMensagem.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--bg-card-2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            >
              Enviar Sugestão
            </button>
            {sugestaoEnviada && (
              <span className="text-sm font-semibold" style={{ color: '#22C55E' }}>
                Sugestão enviada!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Confirm delete */}
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
              <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Excluir Escala</h2>
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
                  try { await removeEscala(confirmDelete); } catch (err) { console.error(err); }
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
