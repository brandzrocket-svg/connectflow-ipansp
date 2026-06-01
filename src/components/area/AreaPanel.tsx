import { useState, useRef } from 'react';
import { useEscalas } from '../../hooks/useEscalas';
import { useVoluntarios } from '../../hooks/useVoluntarios';
import type { Area } from '../../types';
import { createReport } from '../../lib/storage';
import { EVENTOS_CALENDARIO } from '../../constants/calendario';

const TIPO_COR: Record<string, string> = {
  culto_regular: '#3B82F6',
  santa_ceia:   '#D946EF',
  especial:     '#EAB308',
  semanal:      '#22C55E',
};

const TIPO_LABEL: Record<string, string> = {
  culto_regular: 'Regular',
  santa_ceia:   'Santa Ceia',
  especial:     'Especial',
  semanal:      'Semanal',
};

const MESES_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];
const DIAS_SEMANA_CURTO = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const DIAS_SEMANA_FULL  = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];

interface AreaPanelProps {
  area: Area;
  isAuthenticated: boolean;
  user: { email: string } | null;
}

export default function AreaPanel({ area, isAuthenticated, user }: AreaPanelProps) {
  const [year, setYear]   = useState(2026);
  const [month, setMonth] = useState(6);
  const listRef = useRef<HTMLDivElement>(null);

  const cor = area.cor === '#FFFFFF' ? '#888888' : area.cor;

  // Church events from static calendar — no Supabase fetch needed
  const eventosMes = EVENTOS_CALENDARIO
    .filter(e => {
      const [y, m] = e.data.split('-').map(Number);
      return y === year && m === month;
    })
    .sort((a, b) => a.data.localeCompare(b.data));

  const { escalas, saveEscala, removeEscala, loading } = useEscalas(area.id);
  const { voluntarios, error: voluntarioError, addVoluntario, removeVoluntario } = useVoluntarios(area.id);

  // Inline checklist
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [draftVols, setDraftVols]     = useState<Record<string, string[]>>({});
  const [draftObs, setDraftObs]       = useState<Record<string, string>>({});
  const [saving, setSaving]           = useState<string | null>(null);
  const [saveError, setSaveError]     = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Report / Sugestão
  const [reportMensagem, setReportMensagem]   = useState('');
  const [reportEnviado, setReportEnviado]     = useState(false);
  const [reportEnviando, setReportEnviando]   = useState(false);
  const [sugestaoMensagem, setSugestaoMensagem] = useState('');
  const [sugestaoEnviada, setSugestaoEnviada]   = useState(false);

  // Voluntários
  const [novoVoluntario, setNovoVoluntario]         = useState('');
  const [adicionandoVoluntario, setAdicionandoVoluntario] = useState(false);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  function handleOpen(eventoId: string) {
    if (expandedId === eventoId) { setExpandedId(null); return; }
    const esc = escalas.find(e => e.evento_id === eventoId);
    setDraftVols(p => ({ ...p, [eventoId]: esc?.voluntarios ?? [] }));
    setDraftObs(p => ({ ...p, [eventoId]: esc?.observacao ?? '' }));
    setExpandedId(eventoId);
  }

  function handleCalendarClick(dataStr: string) {
    const evsDia = eventosMes.filter(e => e.data === dataStr);
    if (evsDia.length === 0) return;
    handleOpen(evsDia[0].id);
    setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }

  function toggleVol(eventoId: string, nome: string) {
    setDraftVols(p => {
      const cur = p[eventoId] ?? [];
      return { ...p, [eventoId]: cur.includes(nome) ? cur.filter(v => v !== nome) : [...cur, nome] };
    });
  }

  async function saveInline(eventoId: string) {
    setSaving(eventoId);
    setSaveError(null);
    try {
      await saveEscala({
        evento_id: eventoId,
        area_id: area.id,
        voluntarios: draftVols[eventoId] ?? [],
        observacao: draftObs[eventoId] || undefined,
        criado_por: user?.email,
      });
      setExpandedId(null);
    } catch (err: unknown) {
      console.error('Erro ao salvar escala:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setSaveError(msg || 'Erro ao salvar. Verifique as configurações do Supabase.');
    } finally {
      setSaving(null);
    }
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

  // Calendar grid
  const hoje = new Date().toISOString().slice(0, 10);
  const primeiroDia = new Date(year, month - 1, 1).getDay();
  const diasNoMes   = new Date(year, month, 0).getDate();
  const cells: Array<number | null> = [
    ...Array(primeiroDia).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="animate-fade-in">

      {/* ─── Area header ─── */}
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
        <div className="flex items-center gap-1.5 rounded-xl px-3 py-2" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <button onClick={prevMonth} className="w-6 h-6 flex items-center justify-center rounded text-lg font-light transition-colors" style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>‹</button>
          <span className="text-xs font-semibold tracking-wider uppercase min-w-[90px] text-center" style={{ color: 'var(--text-primary)' }}>
            {MESES_PT[month - 1]} {year}
          </span>
          <button onClick={nextMonth} className="w-6 h-6 flex items-center justify-center rounded text-lg font-light transition-colors" style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>›</button>
        </div>
      </div>

      {/* ─── Save error banner ─── */}
      {saveError && (
        <div
          className="rounded-xl px-4 py-3 mb-4 flex items-start gap-3 text-sm"
          style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171' }}
        >
          <span className="flex-shrink-0">⚠️</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">Erro ao salvar escala</p>
            <p className="text-xs mt-0.5 opacity-80">{saveError}</p>
          </div>
          <button onClick={() => setSaveError(null)} style={{ color: '#F87171' }}>×</button>
        </div>
      )}

      {/* ─── Calendar grid ─── */}
      <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        {/* Legend */}
        <div className="flex items-center gap-4 mb-3 flex-wrap">
          {(['culto_regular', 'santa_ceia', 'especial'] as const).map(tipo => (
            <div key={tipo} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TIPO_COR[tipo] }} />
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{TIPO_LABEL[tipo]}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cor }} />
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Com escala</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {DIAS_SEMANA_CURTO.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold py-1" style={{ color: 'var(--text-muted)' }}>{d}</div>
          ))}
          {cells.map((dia, idx) => {
            if (dia === null) return <div key={`e-${idx}`} />;
            const dataStr = `${year}-${String(month).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            const evsDia  = eventosMes.filter(e => e.data === dataStr);
            const isHoje  = dataStr === hoje;
            const hasEscala = evsDia.some(ev => escalas.some(e => e.evento_id === ev.id));
            const clickable = evsDia.length > 0;

            return (
              <div
                key={dia}
                onClick={() => clickable && handleCalendarClick(dataStr)}
                className="rounded-lg p-1 min-h-[44px] flex flex-col gap-0.5 overflow-hidden transition-all"
                style={{
                  backgroundColor: isHoje ? 'rgba(255,255,255,0.06)' : 'var(--bg-card-2)',
                  border: isHoje ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                  cursor: clickable ? 'pointer' : 'default',
                }}
                onMouseEnter={e => { if (clickable) e.currentTarget.style.borderColor = `${cor}70`; }}
                onMouseLeave={e => { if (clickable) e.currentTarget.style.borderColor = isHoje ? 'rgba(255,255,255,0.2)' : 'transparent'; }}
              >
                <span className="text-xs font-bold self-end" style={{ color: isHoje ? 'var(--text-primary)' : 'var(--text-secondary)', opacity: isHoje ? 1 : 0.6 }}>
                  {dia}
                </span>
                {evsDia.map(ev => (
                  <div
                    key={ev.id}
                    className="w-full rounded px-1 text-[8px] font-semibold leading-snug truncate"
                    style={{
                      backgroundColor: hasEscala ? `${cor}28` : `${TIPO_COR[ev.tipo]}22`,
                      color: hasEscala ? cor : TIPO_COR[ev.tipo],
                    }}
                    title={ev.titulo}
                  >
                    {ev.titulo}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Event list ─── */}
      <div ref={listRef}>
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton rounded-2xl h-16" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        ) : eventosMes.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <p className="text-3xl mb-3">📅</p>
            <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Nenhum evento neste mês</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Navegue para outro mês</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 stagger">
            {eventosMes.map(evento => {
              const escala   = escalas.find(e => e.evento_id === evento.id);
              const isOpen   = expandedId === evento.id;
              const d        = new Date(evento.data + 'T00:00:00');
              const diaNum   = d.getDate();
              const mesAbrev = MESES_PT[d.getMonth()].slice(0, 3).toUpperCase();
              const diaSem   = DIAS_SEMANA_FULL[d.getDay()];
              const volCount = escala?.voluntarios?.length ?? 0;
              const tipoCor  = TIPO_COR[evento.tipo] ?? '#6B7280';

              return (
                <div
                  key={evento.id}
                  style={{
                    borderRadius: '16px',
                    border: `1px solid ${isOpen ? cor + '55' : 'var(--border-color)'}`,
                    backgroundColor: 'var(--bg-card)',
                    transition: 'border-color 0.2s ease',
                    overflow: 'hidden',
                  }}
                >
                  {/* Row */}
                  <button
                    onClick={() => handleOpen(evento.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    style={{ background: 'none', cursor: 'pointer' }}
                  >
                    {/* Date badge */}
                    <div className="flex-shrink-0 text-center" style={{ minWidth: '36px' }}>
                      <div className="font-black text-xl leading-none" style={{ color: 'var(--text-primary)' }}>{diaNum}</div>
                      <div className="text-[9px] uppercase font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>{mesAbrev}</div>
                    </div>
                    {/* Divider */}
                    <div className="w-px h-8 flex-shrink-0" style={{ backgroundColor: 'var(--border-color)' }} />
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>{diaSem}</span>
                        {evento.horario && (
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>· {evento.horario}</span>
                        )}
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${tipoCor}20`, color: tipoCor }}>
                          {TIPO_LABEL[evento.tipo]}
                        </span>
                      </div>
                      <p className="font-semibold text-sm mt-0.5 truncate" style={{ color: 'var(--text-primary)' }}>{evento.titulo}</p>
                      {volCount > 0 ? (
                        <p className="text-[11px] mt-0.5 truncate" style={{ color: cor }}>
                          ✓ {volCount} vol.: {escala!.voluntarios.join(', ')}
                        </p>
                      ) : (
                        <p className="text-[11px] mt-0.5 italic" style={{ color: 'var(--text-muted)' }}>Sem escala definida</p>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isAuthenticated && escala && (
                        <span
                          role="button"
                          onClick={e => { e.stopPropagation(); setConfirmDelete(escala.id); }}
                          className="text-xs px-2 py-1 rounded-lg transition-colors"
                          style={{ color: '#EF4444', backgroundColor: 'rgba(239,68,68,0.08)' }}
                        >
                          ✕
                        </span>
                      )}
                      <span
                        className="text-base"
                        style={{ color: 'var(--text-muted)', display: 'inline-block', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}
                      >
                        ▾
                      </span>
                    </div>
                  </button>

                  {/* Inline checklist */}
                  {isOpen && (
                    <div className="px-4 pb-4 pt-2" style={{ borderTop: `1px solid ${cor}25` }}>
                      {voluntarios.length === 0 ? (
                        <p className="text-sm italic py-3 text-center" style={{ color: 'var(--text-muted)' }}>
                          Cadastre voluntários desta área primeiro (seção abaixo).
                        </p>
                      ) : (
                        <>
                          <p className="text-[10px] font-bold uppercase tracking-widest mt-1 mb-3" style={{ color: 'var(--text-muted)' }}>
                            Selecionar voluntários para {evento.titulo}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                            {voluntarios.map(v => {
                              const checked = (draftVols[evento.id] ?? []).includes(v.nome);
                              return (
                                <label
                                  key={v.id}
                                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                                  style={{
                                    backgroundColor: checked ? `${cor}15` : 'var(--bg-card-2)',
                                    border: `1px solid ${checked ? cor + '45' : 'var(--border-color)'}`,
                                    cursor: isAuthenticated ? 'pointer' : 'default',
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => isAuthenticated && toggleVol(evento.id, v.nome)}
                                    disabled={!isAuthenticated}
                                    className="sr-only"
                                  />
                                  <span
                                    className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all"
                                    style={{
                                      backgroundColor: checked ? cor : 'transparent',
                                      border: `1.5px solid ${checked ? cor : 'var(--border-color)'}`,
                                      color: '#000',
                                    }}
                                  >
                                    {checked ? '✓' : ''}
                                  </span>
                                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{v.nome}</span>
                                </label>
                              );
                            })}
                          </div>

                          {isAuthenticated && (
                            <>
                              <textarea
                                value={draftObs[evento.id] ?? ''}
                                onChange={e => setDraftObs(p => ({ ...p, [evento.id]: e.target.value }))}
                                placeholder="Observações (opcional)..."
                                rows={2}
                                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none resize-none mb-3"
                                style={{ backgroundColor: 'var(--bg-card-2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                              />
                              <div className="flex gap-3">
                                <button
                                  onClick={() => setExpandedId(null)}
                                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
                                  style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => saveInline(evento.id)}
                                  disabled={saving === evento.id}
                                  className="flex-1 rounded-xl py-2.5 text-sm font-bold disabled:opacity-50 transition-opacity hover:opacity-90"
                                  style={{ backgroundColor: cor, color: '#000' }}
                                >
                                  {saving === evento.id ? 'Salvando...' : 'Salvar Escala'}
                                </button>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Voluntários ─── */}
      <div id="voluntarios-section" className="mt-6 rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cor }} />
          <h3 className="font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Voluntários</h3>
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
            <h3 className="font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Reportar para o Líder</h3>
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
              {reportEnviado && <span className="text-sm font-semibold" style={{ color: '#22C55E' }}>Report enviado!</span>}
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
          <h3 className="font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Sugestões de Melhoria</h3>
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
            {sugestaoEnviada && <span className="text-sm font-semibold" style={{ color: '#22C55E' }}>Sugestão enviada!</span>}
          </div>
        </form>
      </div>

      {/* ─── Confirm delete escala ─── */}
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
