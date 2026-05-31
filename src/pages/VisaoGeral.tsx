import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useReports } from '../hooks/useReports';
import Header from '../components/layout/Header';
import { AREAS } from '../constants/areas';
import { EVENTOS_CALENDARIO } from '../constants/calendario';
import { getEscalas } from '../lib/storage';
import type { Escala } from '../types';

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

const MESES_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

const DIAS_SEMANA_CURTO = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

const MESES_CURTOS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function getAreaById(id: string) {
  return AREAS.find(a => a.id === id);
}

// ---------------------------------------------------------------------------
// Sub-components
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

  const top = Object.entries(ranking)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 8);

  const max = top[0]?.[1].count ?? 1;

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
    >
      <h2 className="text-white font-black text-sm tracking-widest uppercase">
        Voluntários mais presentes
      </h2>

      {top.length === 0 ? (
        <p className="text-gray-500 text-sm italic">Nenhuma escala registrada ainda.</p>
      ) : (
        <div className="flex flex-col gap-3 stagger">
          {top.map(([nome, info], i) => {
            // determina a cor da área onde mais serviu
            const topAreaId = Object.entries(info.areas).sort(([,a],[,b]) => b - a)[0]?.[0];
            const topArea = getAreaById(topAreaId ?? '');
            const barColor = topArea?.cor && topArea.cor !== '#FFFFFF' ? topArea.cor : '#6B7280';
            const pct = Math.round((info.count / max) * 100);

            return (
              <div key={nome} className="flex items-center gap-3">
                <span className="text-gray-600 text-xs font-bold w-4 text-right flex-shrink-0">
                  {i + 1}
                </span>
                <span
                  className="text-gray-300 text-xs font-semibold truncate flex-shrink-0"
                  style={{ width: '110px' }}
                >
                  {nome}
                </span>
                <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: 'var(--bg-card-2)' }}>
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${barColor}99, ${barColor})`,
                    }}
                  />
                </div>
                <span className="text-gray-400 text-xs font-bold flex-shrink-0 w-6 text-right">
                  {info.count}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReportsSection({
  reports,
  loading,
  onMarcarLido,
}: {
  reports: ReturnType<typeof useReports>['reports'];
  loading: boolean;
  onMarcarLido: (id: string) => void;
}) {
  const ultimos = reports.slice(0, 10);

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
    >
      <h2 className="text-white font-black text-sm tracking-widest uppercase">
        Últimos Reports
      </h2>

      {loading ? (
        <p className="text-gray-500 text-sm italic">Carregando...</p>
      ) : ultimos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <span className="text-3xl">📭</span>
          <p className="text-gray-500 text-sm font-medium">Nenhum report enviado ainda</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {ultimos.map(r => {
            const area = getAreaById(r.area_id);
            const cor = area?.cor && area.cor !== '#FFFFFF' ? area.cor : '#6B7280';
            return (
              <button
                key={r.id}
                onClick={() => { if (!r.lido) onMarcarLido(r.id); }}
                className="w-full text-left rounded-xl p-3 transition-all duration-150 hover:bg-white/5"
                style={{ border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                    style={{ backgroundColor: cor }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold" style={{ color: cor }}>
                        {area?.nome ?? r.area_id}
                      </span>
                      <span className="text-gray-600 text-xs">
                        {tempoRelativo(r.criado_em)}
                      </span>
                      {!r.lido && (
                        <span
                          className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#F87171' }}
                        >
                          Novo
                        </span>
                      )}
                    </div>
                    <p
                      className="text-gray-300 text-xs mt-0.5 leading-relaxed"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      } as React.CSSProperties}
                    >
                      {r.mensagem}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProximosEventos({ escalas }: { escalas: Escala[] }) {
  const hoje = new Date().toISOString().slice(0, 10);
  const futuros = EVENTOS_CALENDARIO.filter(e => e.data >= hoje);
  const [mesFiltro, setMesFiltro] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const mesesDisponiveis = Array.from(new Set(futuros.map(e => Number(e.data.slice(5, 7))))).sort();

  const exibir = mesFiltro
    ? futuros.filter(e => Number(e.data.slice(5, 7)) === mesFiltro)
    : futuros;

  const primeiroFuturoIdx = EVENTOS_CALENDARIO.findIndex(e => e.data >= hoje);
  const primeiroId = EVENTOS_CALENDARIO[primeiroFuturoIdx]?.id;

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-white font-black text-sm tracking-widest uppercase">
          Próximos Eventos
        </h2>
        <select
          value={mesFiltro ?? ''}
          onChange={e => setMesFiltro(e.target.value ? Number(e.target.value) : null)}
          className="text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer"
          style={{
            backgroundColor: 'var(--bg-card-2)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="">Todos os meses</option>
          {mesesDisponiveis.map(m => (
            <option key={m} value={m}>{MESES_PT[m - 1]}</option>
          ))}
        </select>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-3 scroll-x"
        style={{ scrollbarWidth: 'thin' }}
      >
        {exibir.length === 0 ? (
          <p className="text-gray-500 text-sm italic py-4">Nenhum evento neste período.</p>
        ) : (
          exibir.map(ev => {
            const badge = TIPO_BADGE[ev.tipo];
            const isPast = ev.data < hoje;
            const isDestaque = ev.id === primeiroId;
            const d = new Date(ev.data + 'T12:00:00');
            const dia = String(d.getDate()).padStart(2, '0');
            const mes = MESES_CURTOS[d.getMonth()];
            const diaSem = DIAS_SEMANA_CURTO[d.getDay()];

            // Escalas associadas a este evento pelo título — busca por data aproximada
            // escalas linkadas por data futura via eventos cadastrados

            // Áreas que têm escala no mesmo dia (usando a data do evento)
            const areasNoDia = AREAS.filter(area =>
              escalas.some(esc => esc.area_id === area.id)
            );
            void areasNoDia;

            return (
              <div
                key={ev.id}
                className="flex-shrink-0 rounded-2xl p-4 flex flex-col gap-2 transition-all"
                style={{
                  minWidth: '180px',
                  width: '180px',
                  backgroundColor: 'var(--bg-card-2)',
                  border: isDestaque
                    ? '1.5px solid rgba(255,255,255,0.5)'
                    : '1px solid var(--border-color)',
                  opacity: isPast ? 0.4 : 1,
                  filter: isPast ? 'grayscale(1)' : 'none',
                  boxShadow: isDestaque ? '0 0 0 1px rgba(234,179,8,0.3)' : 'none',
                }}
              >
                {/* Data */}
                <div className="flex items-baseline gap-1.5">
                  <span className="text-white font-black text-2xl leading-none">{dia}</span>
                  <span className="text-gray-400 text-xs font-semibold uppercase">{mes}</span>
                </div>
                <span className="text-gray-500 text-xs font-medium -mt-1">{diaSem}</span>

                {/* Título */}
                <p className="text-white text-xs font-semibold leading-snug mt-1 line-clamp-2">
                  {ev.titulo}
                </p>

                {/* Horário */}
                {ev.horario && (
                  <span className="text-gray-500 text-xs">{ev.horario}</span>
                )}

                {/* Badge tipo */}
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full self-start mt-auto"
                  style={{ color: badge.color, backgroundColor: badge.bg }}
                >
                  {badge.label}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function CalendarioIgreja() {
  const hoje = new Date().toISOString().slice(0, 10);
  // Meses disponíveis: 6 (junho) a 12 (dezembro) de 2026
  const [mes, setMes] = useState(() => {
    const m = new Date().getMonth() + 1;
    return Math.min(Math.max(m, 6), 12);
  });
  const ano = 2026;

  function prevMes() { setMes(m => Math.max(m - 1, 6)); }
  function nextMes() { setMes(m => Math.min(m + 1, 12)); }

  const eventosMes = EVENTOS_CALENDARIO.filter(e => Number(e.data.slice(5, 7)) === mes && Number(e.data.slice(0, 4)) === ano);

  // Construir grid
  const primeiroDia = new Date(ano, mes - 1, 1).getDay(); // 0=dom
  const diasNoMes = new Date(ano, mes, 0).getDate();

  const cells: Array<number | null> = [
    ...Array(primeiroDia).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];
  // pad to complete rows
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
    >
      {/* Header do calendário */}
      <div className="flex items-center justify-between">
        <h2 className="text-white font-black text-sm tracking-widest uppercase">
          Calendário da Igreja
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={prevMes}
            disabled={mes <= 6}
            className="text-gray-500 hover:text-white disabled:opacity-30 transition-colors w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 disabled:cursor-not-allowed"
          >
            ‹
          </button>
          <span className="text-white text-sm font-semibold min-w-[110px] text-center">
            {MESES_PT[mes - 1]} {ano}
          </span>
          <button
            onClick={nextMes}
            disabled={mes >= 12}
            className="text-gray-500 hover:text-white disabled:opacity-30 transition-colors w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 disabled:cursor-not-allowed"
          >
            ›
          </button>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 flex-wrap">
        {[
          { tipo: 'culto_regular', label: 'Culto Regular' },
          { tipo: 'santa_ceia',   label: 'Santa Ceia'    },
          { tipo: 'especial',     label: 'Especial'       },
        ].map(({ tipo, label }) => (
          <div key={tipo} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: TIPO_DOT_COLOR[tipo] }}
            />
            <span className="text-gray-500 text-xs">{label}</span>
          </div>
        ))}
      </div>

      {/* Grid dos dias da semana */}
      <div className="grid grid-cols-7 gap-0.5">
        {DIAS_SEMANA_CURTO.map(d => (
          <div key={d} className="text-center text-gray-600 text-[10px] sm:text-xs font-semibold py-1 truncate">
            {d}
          </div>
        ))}

        {cells.map((dia, idx) => {
          if (dia === null) {
            return <div key={`empty-${idx}`} className="rounded-lg" />;
          }
          const dataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
          const evs = eventosMes.filter(e => e.data === dataStr);
          const isHoje = dataStr === hoje;

          return (
            <div
              key={dia}
              className="rounded-lg p-1 min-h-[48px] sm:min-h-[56px] flex flex-col gap-0.5 overflow-hidden"
              style={{
                backgroundColor: isHoje ? 'rgba(255,255,255,0.06)' : 'var(--bg-card-2)',
                border: isHoje ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
              }}
            >
              <span
                className="text-xs font-bold self-end"
                style={{ color: isHoje ? '#FFFFFF' : 'var(--text-primary)', opacity: isHoje ? 1 : 0.5 }}
              >
                {dia}
              </span>
              {evs.map(ev => (
                <div
                  key={ev.id}
                  className="w-full rounded px-1 text-[9px] font-semibold leading-snug truncate"
                  style={{
                    backgroundColor: `${TIPO_DOT_COLOR[ev.tipo]}25`,
                    color: TIPO_DOT_COLOR[ev.tipo],
                  }}
                  title={`${ev.titulo}${ev.horario ? ' — ' + ev.horario : ''}`}
                >
                  {ev.titulo}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function VisaoGeral() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { reports, loading: loadingReports, marcarLido } = useReports();
  const [escalas, setEscalas] = useState<Escala[]>([]);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    getEscalas().then(setEscalas).catch(console.error);
  }, []);

  // Dummy month state for Header (not used functionally on this page)
  const now = new Date();
  const [month] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Header
        mes={month}
        ano={year}
        onPrevMonth={() => {}}
        onNextMonth={() => {}}
        user={user ? { email: user.email ?? '', nome: user.email ?? '' } : null}
        onLoginClick={() => navigate('/login')}
        onLogout={logout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        {/* Botão voltar */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-500 hover:text-white text-sm font-medium transition-colors mb-6 group"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          Dashboard
        </button>

        <div className="mb-6">
          <h1 className="text-white font-black text-xl tracking-tight uppercase">Visão Geral</h1>
          <p className="text-gray-500 text-sm mt-0.5">Panorama completo do ministério de mídia</p>
        </div>

        {/* Row 1: Ranking + Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <RankingSection escalas={escalas} />
          <ReportsSection
            reports={reports}
            loading={loadingReports}
            onMarcarLido={marcarLido}
          />
        </div>

        {/* Row 2: Próximos Eventos */}
        <div className="mb-6">
          <ProximosEventos escalas={escalas} />
        </div>

        {/* Row 3: Calendário */}
        <CalendarioIgreja />
      </div>
    </div>
  );
}
