import { useState, useEffect, useRef } from 'react';
import { useReports } from '../hooks/useReports';
import { AREAS } from '../constants/areas';
import { EVENTOS_CALENDARIO } from '../constants/calendario';
import { getEscalas, getAllEventos } from '../lib/storage';
import type { Escala, Evento } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tempoRelativo(dateStr: string): string {
  const agora = Date.now();
  const entao = new Date(dateStr).getTime();
  const diff = agora - entao;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d} dia${d > 1 ? 's' : ''}`;
}

const TIPO_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  culto_regular: { label: 'Culto Regular', color: '#93C5FD', bg: 'rgba(59,130,246,0.15)' },
  santa_ceia:   { label: 'Santa Ceia',    color: '#E879F9', bg: 'rgba(217,70,239,0.15)' },
  especial:     { label: 'Especial',      color: '#FDE68A', bg: 'rgba(234,179,8,0.15)'  },
  semanal:      { label: 'Semanal',       color: '#86EFAC', bg: 'rgba(34,197,94,0.15)'  },
};

const TIPO_DOT_COLOR: Record<string, string> = {
  culto_regular: '#3B82F6',
  santa_ceia:   '#D946EF',
  especial:     '#EAB308',
  semanal:      '#22C55E',
};

const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS_SEMANA_CURTO = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const DIAS_SEMANA_LONGO = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
const MESES_CURTOS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function getAreaById(id: string) { return AREAS.find(a => a.id === id); }

// ---------------------------------------------------------------------------
// Drag-and-drop
// ---------------------------------------------------------------------------

type BlockId = 'ranking' | 'reports' | 'proximos' | 'calendario';
const DEFAULT_ORDER: BlockId[] = ['ranking', 'reports', 'proximos', 'calendario'];
const BLOCK_LABELS: Record<BlockId, string> = {
  ranking: 'Voluntários mais presentes',
  reports: 'Últimos Reports',
  proximos: 'Próximos Eventos',
  calendario: 'Calendário da Igreja',
};

function loadOrder(): BlockId[] {
  try {
    const saved = localStorage.getItem('vg-block-order');
    if (saved) {
      const parsed = JSON.parse(saved) as BlockId[];
      if (parsed.length === DEFAULT_ORDER.length) return parsed;
    }
  } catch {}
  return [...DEFAULT_ORDER];
}

function DragHandle() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" style={{ opacity: 0.3 }}>
      <circle cx="4" cy="3" r="1.2" /><circle cx="10" cy="3" r="1.2" />
      <circle cx="4" cy="7" r="1.2" /><circle cx="10" cy="7" r="1.2" />
      <circle cx="4" cy="11" r="1.2" /><circle cx="10" cy="11" r="1.2" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// EscalasModal
// ---------------------------------------------------------------------------

function EscalasModal({ date, escalas, eventosDB, onClose }: {
  date: string;
  escalas: Escala[];
  eventosDB: Evento[];
  onClose: () => void;
}) {
  const d = new Date(date + 'T12:00:00');
  const dia = d.getDate();
  const mes = MESES_PT[d.getMonth()];
  const diaSem = DIAS_SEMANA_LONGO[d.getDay()];
  const headerLabel = `${dia} de ${mes} · ${diaSem}`;

  // Static calendar events for this date
  const calEvs = EVENTOS_CALENDARIO.filter(e => e.data === date);

  // DB eventos on this date that have escalas
  const dbEvsDia = eventosDB.filter(e => e.data === date);
  const escalasNaData = escalas.filter(esc =>
    dbEvsDia.some(ev => ev.id === esc.evento_id)
  );

  // Group by area
  const areaCards = AREAS.map(area => {
    const volNames = escalasNaData
      .filter(esc => esc.area_id === area.id)
      .flatMap(esc => esc.voluntarios ?? []);
    return { area, volNames };
  }).filter(({ volNames }) => volNames.length > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl flex flex-col overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          maxHeight: '80vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <h2 className="font-black text-base" style={{ color: 'var(--text-primary)' }}>
            {headerLabel}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-sm"
            style={{ backgroundColor: 'var(--bg-card-2)', color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 flex flex-col gap-4">
          {/* Static calendar events */}
          {calEvs.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Programação
              </p>
              <div className="flex flex-wrap gap-2">
                {calEvs.map(ev => (
                  <span
                    key={ev.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: `${TIPO_DOT_COLOR[ev.tipo]}20`,
                      border: `1px solid ${TIPO_DOT_COLOR[ev.tipo]}40`,
                      color: TIPO_DOT_COLOR[ev.tipo],
                    }}
                  >
                    {ev.titulo}
                    {ev.horario && <span className="opacity-70">· {ev.horario}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Area cards */}
          {areaCards.length === 0 ? (
            <p className="text-sm italic text-center py-4" style={{ color: 'var(--text-muted)' }}>
              Nenhuma escala registrada para esta data.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Escalas por Área
              </p>
              {areaCards.map(({ area, volNames }) => {
                const cor = area.cor === '#FFFFFF' ? '#888888' : area.cor;
                return (
                  <div
                    key={area.id}
                    className="rounded-xl p-3"
                    style={{
                      backgroundColor: 'var(--bg-card-2)',
                      border: `1px solid ${cor}30`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cor }} />
                      <span className="text-xs font-bold" style={{ color: cor }}>{area.nome}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {volNames.map((nome, i) => (
                        <span
                          key={`${nome}-${i}`}
                          className="px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${cor}15`,
                            border: `1px solid ${cor}30`,
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {nome}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Block sub-components
// ---------------------------------------------------------------------------

function RankingSection({ escalas }: { escalas: Escala[] }) {
  const ranking: Record<string, { count: number; areas: Record<string, number> }> = {};
  escalas.forEach(e => {
    (e.voluntarios ?? []).forEach(nome => {
      if (!ranking[nome]) ranking[nome] = { count: 0, areas: {} };
      ranking[nome].count += 1;
      ranking[nome].areas[e.area_id] = (ranking[nome].areas[e.area_id] ?? 0) + 1;
    });
  });
  const top = Object.entries(ranking).sort(([,a],[,b]) => b.count - a.count).slice(0, 8);
  const max = top[0]?.[1].count ?? 1;

  if (top.length === 0) return <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>Nenhuma escala registrada ainda.</p>;

  return (
    <div className="flex flex-col gap-3 stagger">
      {top.map(([nome, info], i) => {
        const topAreaId = Object.entries(info.areas).sort(([,a],[,b]) => b - a)[0]?.[0];
        const topArea = getAreaById(topAreaId ?? '');
        const barColor = topArea?.cor && topArea.cor !== '#FFFFFF' ? topArea.cor : '#6B7280';
        const pct = Math.round((info.count / max) * 100);
        return (
          <div key={nome} className="flex items-center gap-3">
            <span className="text-xs font-bold w-4 text-right flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
            <span className="text-xs font-semibold truncate flex-shrink-0" style={{ width: '110px', color: 'var(--text-secondary)' }}>{nome}</span>
            <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: 'var(--bg-card-2)' }}>
              <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${barColor}99,${barColor})` }} />
            </div>
            <span className="text-xs font-bold flex-shrink-0 w-6 text-right" style={{ color: 'var(--text-secondary)' }}>{info.count}</span>
          </div>
        );
      })}
    </div>
  );
}

function ReportsSection({ reports, loading, onMarcarLido }: {
  reports: ReturnType<typeof useReports>['reports'];
  loading: boolean;
  onMarcarLido: (id: string) => void;
}) {
  const naoLidos = reports.filter(r => !r.lido);
  const [mostrarLidos, setMostrarLidos] = useState(false);
  const exibir = mostrarLidos ? reports.slice(0, 20) : naoLidos.slice(0, 10);

  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        {naoLidos.length > 0 && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#F87171' }}>
            {naoLidos.length} novo{naoLidos.length !== 1 ? 's' : ''}
          </span>
        )}
        {reports.some(r => r.lido) && (
          <button onClick={() => setMostrarLidos(v => !v)} className="text-xs transition-colors ml-auto" style={{ color: 'var(--text-muted)' }}>
            {mostrarLidos ? 'Ocultar lidos' : 'Mostrar lidos'}
          </button>
        )}
      </div>
      {loading ? (
        <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>Carregando...</p>
      ) : exibir.length === 0 ? (
        <div className="flex flex-col items-center py-6 gap-2">
          <span className="text-3xl">📭</span>
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Nenhum report pendente</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {exibir.map(r => {
            const area = getAreaById(r.area_id);
            const cor = area?.cor && area.cor !== '#FFFFFF' ? area.cor : '#6B7280';
            const isSugestao = r.mensagem.startsWith('[SUGESTÃO]');
            return (
              <div
                key={r.id}
                className="rounded-xl p-3 transition-all duration-150"
                style={{ border: '1px solid var(--border-color)', opacity: r.lido ? 0.45 : 1, backgroundColor: r.lido ? 'transparent' : 'var(--bg-card-2)' }}
              >
                <div className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: isSugestao ? '#F59E0B' : cor }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold" style={{ color: isSugestao ? '#F59E0B' : cor }}>
                        {isSugestao ? '💡 Sugestão' : area?.nome ?? r.area_id}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{tempoRelativo(r.criado_em)}</span>
                    </div>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
                      {r.mensagem.replace(/^\[(REPORT|SUGESTÃO)\]\s*/, '')}
                    </p>
                  </div>
                  {!r.lido && (
                    <button
                      onClick={() => onMarcarLido(r.id)}
                      title="Marcar como lido"
                      className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-sm transition-all hover:scale-110"
                      style={{ backgroundColor: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22C55E' }}
                    >
                      ✓
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function ProximosEventos({ escalas, eventosDB, onSelectDate }: {
  escalas: Escala[];
  eventosDB: Evento[];
  onSelectDate: (date: string) => void;
}) {
  const hoje = new Date().toISOString().slice(0, 10);
  const futuros = EVENTOS_CALENDARIO.filter(e => e.data >= hoje);
  const [mesFiltro, setMesFiltro] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mesesDisponiveis = Array.from(new Set(futuros.map(e => Number(e.data.slice(5, 7))))).sort();
  const exibir = mesFiltro ? futuros.filter(e => Number(e.data.slice(5, 7)) === mesFiltro) : futuros;
  const primeiroId = futuros[0]?.id;

  function hasEscalasOnDate(date: string): boolean {
    const dbEvsDia = eventosDB.filter(e => e.data === date);
    return escalas.some(esc => dbEvsDia.some(ev => ev.id === esc.evento_id));
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-3">
        <select
          value={mesFiltro ?? ''}
          onChange={e => setMesFiltro(e.target.value ? Number(e.target.value) : null)}
          className="text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer"
          style={{ backgroundColor: 'var(--bg-card-2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        >
          <option value="">Todos os meses</option>
          {mesesDisponiveis.map(m => <option key={m} value={m}>{MESES_PT[m - 1]}</option>)}
        </select>
      </div>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-3 scroll-x">
        {exibir.length === 0 ? (
          <p className="text-sm italic py-4" style={{ color: 'var(--text-muted)' }}>Nenhum evento neste período.</p>
        ) : exibir.map(ev => {
          const badge = TIPO_BADGE[ev.tipo];
          const isPast = ev.data < hoje;
          const isDestaque = ev.id === primeiroId;
          const d = new Date(ev.data + 'T12:00:00');
          const dia = String(d.getDate()).padStart(2, '0');
          const mes = MESES_CURTOS[d.getMonth()];
          const diaSem = DIAS_SEMANA_CURTO[d.getDay()];
          const temEscala = hasEscalasOnDate(ev.data);
          return (
            <div
              key={ev.id}
              onClick={() => onSelectDate(ev.data)}
              className="flex-shrink-0 rounded-2xl p-4 flex flex-col gap-2 cursor-pointer"
              style={{
                minWidth: '175px',
                width: '175px',
                backgroundColor: 'var(--bg-card-2)',
                border: isDestaque ? '1.5px solid rgba(255,255,255,0.4)' : '1px solid var(--border-color)',
                opacity: isPast ? 0.4 : 1,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <div className="flex items-baseline gap-1.5">
                <span className="font-black text-2xl leading-none" style={{ color: 'var(--text-primary)' }}>{dia}</span>
                <span className="text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>{mes}</span>
              </div>
              <span className="text-xs -mt-1" style={{ color: 'var(--text-muted)' }}>{diaSem}</span>
              <p className="text-xs font-semibold leading-snug mt-1 line-clamp-2" style={{ color: 'var(--text-primary)' }}>{ev.titulo}</p>
              {ev.horario && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{ev.horario}</span>}
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full self-start mt-auto" style={{ color: badge.color, backgroundColor: badge.bg }}>{badge.label}</span>
              {temEscala && (
                <div className="flex justify-center">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#22C55E' }} title="Escalas registradas" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function CalendarioIgreja({ escalas, eventosDB, onSelectDate }: {
  escalas: Escala[];
  eventosDB: Evento[];
  onSelectDate: (date: string) => void;
}) {
  const hoje = new Date().toISOString().slice(0, 10);
  const [mes, setMes] = useState(() => Math.min(Math.max(new Date().getMonth() + 1, 6), 12));
  const ano = 2026;
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const eventosMes = EVENTOS_CALENDARIO.filter(e => Number(e.data.slice(5, 7)) === mes && Number(e.data.slice(0, 4)) === ano);
  const primeiroDia = new Date(ano, mes - 1, 1).getDay();
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const cells: Array<number | null> = [...Array(primeiroDia).fill(null), ...Array.from({ length: diasNoMes }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  function isClickable(dataStr: string, evs: typeof eventosMes): boolean {
    if (evs.length > 0) return true;
    const dbEvsDia = eventosDB.filter(e => e.data === dataStr);
    return escalas.some(esc => dbEvsDia.some(ev => ev.id === esc.evento_id));
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          {[{ tipo: 'culto_regular', label: 'Regular' }, { tipo: 'santa_ceia', label: 'Santa Ceia' }, { tipo: 'especial', label: 'Especial' }].map(({ tipo, label }) => (
            <div key={tipo} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TIPO_DOT_COLOR[tipo] }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMes(m => Math.max(m - 1, 6))} disabled={mes <= 6} className="w-7 h-7 flex items-center justify-center rounded-lg disabled:opacity-30" style={{ color: 'var(--text-secondary)' }}>‹</button>
          <span className="text-sm font-semibold min-w-[110px] text-center" style={{ color: 'var(--text-primary)' }}>{MESES_PT[mes - 1]} {ano}</span>
          <button onClick={() => setMes(m => Math.min(m + 1, 12))} disabled={mes >= 12} className="w-7 h-7 flex items-center justify-center rounded-lg disabled:opacity-30" style={{ color: 'var(--text-secondary)' }}>›</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {DIAS_SEMANA_CURTO.map(d => <div key={d} className="text-center text-[10px] font-semibold py-1 truncate" style={{ color: 'var(--text-muted)' }}>{d}</div>)}
        {cells.map((dia, idx) => {
          if (dia === null) return <div key={`e-${idx}`} />;
          const dataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
          const evs = eventosMes.filter(e => e.data === dataStr);
          const isHoje = dataStr === hoje;
          const clickable = isClickable(dataStr, evs);
          const isHovered = hoveredDate === dataStr;
          return (
            <div
              key={dia}
              className="rounded-lg p-1 min-h-[48px] flex flex-col gap-0.5 overflow-hidden"
              style={{
                backgroundColor: isHoje ? 'rgba(255,255,255,0.06)' : 'var(--bg-card-2)',
                border: isHovered && clickable
                  ? '1px solid rgba(255,255,255,0.35)'
                  : isHoje
                    ? '1px solid rgba(255,255,255,0.2)'
                    : '1px solid transparent',
                cursor: clickable ? 'pointer' : 'default',
                transition: 'border-color 0.15s ease',
              }}
              onClick={() => clickable && onSelectDate(dataStr)}
              onMouseEnter={() => clickable && setHoveredDate(dataStr)}
              onMouseLeave={() => setHoveredDate(null)}
            >
              <span className="text-xs font-bold self-end" style={{ color: isHoje ? 'var(--text-primary)' : 'var(--text-secondary)', opacity: isHoje ? 1 : 0.6 }}>{dia}</span>
              {evs.map(ev => <div key={ev.id} className="w-full rounded px-1 text-[9px] font-semibold leading-snug truncate" style={{ backgroundColor: `${TIPO_DOT_COLOR[ev.tipo]}25`, color: TIPO_DOT_COLOR[ev.tipo] }} title={ev.titulo}>{ev.titulo}</div>)}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

export default function VisaoGeralPanel() {
  const { reports, loading: loadingReports, marcarLido } = useReports();
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [eventosDB, setEventosDB] = useState<Evento[]>([]);
  const [order, setOrder] = useState<BlockId[]>(loadOrder);
  const [dragging, setDragging] = useState<BlockId | null>(null);
  const [dragOver, setDragOver] = useState<BlockId | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => { getEscalas().then(setEscalas).catch(console.error); }, []);
  useEffect(() => { getAllEventos().then(setEventosDB).catch(console.error); }, []);

  function handleDragStart(id: BlockId) { setDragging(id); }
  function handleDragOver(e: React.DragEvent, id: BlockId) { e.preventDefault(); if (id !== dragging) setDragOver(id); }
  function handleDrop(targetId: BlockId) {
    if (!dragging || dragging === targetId) { setDragging(null); setDragOver(null); return; }
    const newOrder = [...order];
    const fromIdx = newOrder.indexOf(dragging);
    const toIdx = newOrder.indexOf(targetId);
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, dragging);
    setOrder(newOrder);
    localStorage.setItem('vg-block-order', JSON.stringify(newOrder));
    setDragging(null);
    setDragOver(null);
  }

  function renderBlock(id: BlockId) {
    switch (id) {
      case 'ranking':    return <RankingSection escalas={escalas} />;
      case 'reports':    return <ReportsSection reports={reports} loading={loadingReports} onMarcarLido={marcarLido} />;
      case 'proximos':   return <ProximosEventos escalas={escalas} eventosDB={eventosDB} onSelectDate={setSelectedDate} />;
      case 'calendario': return <CalendarioIgreja escalas={escalas} eventosDB={eventosDB} onSelectDate={setSelectedDate} />;
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-black text-xl tracking-tight uppercase" style={{ color: 'var(--text-primary)' }}>Visão Geral</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Panorama do ministério · arraste os blocos para reorganizar
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {order.map(blockId => {
          const isDraggingThis = dragging === blockId;
          const isDragTarget = dragOver === blockId;
          return (
            <div
              key={blockId}
              draggable
              onDragStart={() => handleDragStart(blockId)}
              onDragOver={e => handleDragOver(e, blockId)}
              onDrop={() => handleDrop(blockId)}
              onDragEnd={() => { setDragging(null); setDragOver(null); }}
              className="rounded-2xl p-5"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: isDragTarget ? '2px solid var(--text-secondary)' : '1px solid var(--border-color)',
                opacity: isDraggingThis ? 0.35 : 1,
                cursor: 'grab',
                transform: isDragTarget ? 'scale(1.01)' : 'none',
                transition: 'transform 0.15s ease, opacity 0.15s ease, border-color 0.15s ease',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span style={{ color: 'var(--text-muted)' }}><DragHandle /></span>
                <h2 className="font-black text-sm tracking-widest uppercase" style={{ color: 'var(--text-primary)' }}>
                  {BLOCK_LABELS[blockId]}
                </h2>
              </div>
              {renderBlock(blockId)}
            </div>
          );
        })}
      </div>

      {selectedDate && (
        <EscalasModal
          date={selectedDate}
          escalas={escalas}
          eventosDB={eventosDB}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
