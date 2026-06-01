import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEventos } from '../hooks/useEventos';
import { useEscalas } from '../hooks/useEscalas';
import { useTheme } from '../hooks/useTheme';
import EventoCard from '../components/dashboard/EventoCard';
import AreaPanel from '../components/area/AreaPanel';
import VisaoGeralPanel from '../panels/VisaoGeralPanel';
import SobrePanel from '../panels/SobrePanel';
import Tutorial from '../components/Tutorial';
import { AREAS } from '../constants/areas';
import { getVoluntariosCountByArea } from '../lib/storage';
import { supabase } from '../lib/supabase';

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
  useTheme();

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, navigate]);

  const [view, setView] = useState('home');
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(6);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showAddEvento, setShowAddEvento] = useState(false);
  const [novoEvento, setNovoEvento] = useState<NovoEventoForm>({ data: '', titulo: '', descricao: '' });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { eventos, addEvento, removeEvento, refresh: refreshEventos, loading: loadingEventos } = useEventos(year, month);
  const { escalas, refresh: refreshEscalas, loading: loadingEscalas } = useEscalas();
  const [volCounts, setVolCounts] = useState<Record<string, number>>({});

  useEffect(() => { refreshEventos(); }, [refreshEventos]);

  useEffect(() => {
    getVoluntariosCountByArea().then(setVolCounts).catch(console.error);
    const channel = supabase
      .channel('voluntarios-home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voluntarios' }, () => {
        getVoluntariosCountByArea().then(setVolCounts).catch(console.error);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

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

  function navTo(v: string) {
    setView(v);
    setSidebarOpen(false);
  }

  // ─── Sidebar ───────────────────────────────────────────────────────────────
  function Sidebar() {
    return (
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="px-5 pt-6 pb-5">
          <button onClick={() => navTo('home')} className="bg-transparent border-0 p-0 cursor-pointer block">
            <img src="/logo-connect.png" alt="Connect IPAN SP" style={{ height: '28px', width: 'auto' }} />
          </button>
        </div>

        {/* Navigation — scrollable */}
        <nav className="flex-1 overflow-y-auto px-3 py-1 flex flex-col gap-0.5">
          {/* Main section */}
          <p className="text-[9px] font-bold uppercase tracking-widest px-2 pt-1 pb-2" style={{ color: 'var(--text-muted)' }}>
            Módulos
          </p>
          {[
            { id: 'escalas',     icon: '📅', label: 'Escalas'      },
            { id: 'visao-geral', icon: '📊', label: 'Visão Geral'  },
            { id: 'sobre',       icon: 'ℹ️',  label: 'Sobre'        },
          ].map(({ id, icon, label }) => (
            <NavBtn key={id} id={id} icon={icon} label={label} currentView={view} onNav={navTo} />
          ))}

          {/* Areas section */}
          <p className="text-[9px] font-bold uppercase tracking-widest px-2 pt-4 pb-2" style={{ color: 'var(--text-muted)' }}>
            Áreas
          </p>
          {AREAS.map(area => (
            <NavBtn key={area.id} id={area.id} label={area.nome} currentView={view} onNav={navTo} area={area} />
          ))}
        </nav>

        {/* Bottom controls */}
        <div className="px-3 py-4 flex flex-col gap-0.5" style={{ borderTop: '1px solid var(--border-color)' }}>
          {/* Tutorial */}
          <button
            onClick={() => { setShowTutorial(true); setSidebarOpen(false); }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-left w-full text-xs font-medium transition-all"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <span className="flex-shrink-0 text-sm">▶</span>
            <span className="truncate">Tutorial</span>
          </button>

          {/* Auth */}
          {user ? (
            <>
              <div className="flex items-center gap-2.5 px-3 py-2">
                <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-black" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
                  {user.email?.[0]?.toUpperCase()}
                </div>
                <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
              </div>
              <button
                onClick={() => logout()}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-left w-full text-xs font-medium transition-all"
                style={{ color: 'rgba(239,68,68,0.7)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#EF4444'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(239,68,68,0.7)'; }}
              >
                <span className="flex-shrink-0">↪</span>
                <span className="truncate">Sair</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-left w-full text-xs font-medium transition-all"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <span className="flex-shrink-0">→</span>
              <span className="truncate">Entrar</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>

      {/* ─── Desktop sidebar ─── */}
      <aside
        className="hidden lg:flex flex-col flex-shrink-0"
        style={{
          width: '210px',
          height: '100vh',
          backgroundColor: 'var(--bg-card)',
          borderRight: '1px solid var(--border-color)',
        }}
      >
        <Sidebar />
      </aside>

      {/* ─── Mobile sidebar overlay ─── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Mobile sidebar drawer ─── */}
      <aside
        className="fixed top-0 left-0 bottom-0 z-50 flex flex-col lg:hidden"
        style={{
          width: '220px',
          backgroundColor: 'var(--bg-card)',
          borderRight: '1px solid var(--border-color)',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
        }}
      >
        <Sidebar />
      </aside>

      {/* ─── Main content ─── */}
      <main className="flex-1 overflow-y-auto h-screen" style={{ minWidth: 0 }}>
        {/* Mobile top bar (hamburger only) */}
        <div
          className="lg:hidden sticky top-0 z-10 flex items-center gap-3 px-4 py-3"
          style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="1" y1="3.5" x2="14" y2="3.5" />
              <line x1="1" y1="7.5" x2="14" y2="7.5" />
              <line x1="1" y1="11.5" x2="14" y2="11.5" />
            </svg>
          </button>
          <img src="/logo-connect.png" alt="Connect" style={{ height: '20px', width: 'auto' }} />
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-w-4xl mx-auto w-full">
          {selectedArea ? (
            <AreaPanel key={view} area={selectedArea} isAuthenticated={isAuthenticated} user={user ? { email: user.email ?? '' } : null} />
          ) : view === 'visao-geral' ? (
            <VisaoGeralPanel />
          ) : view === 'sobre' ? (
            <SobrePanel onSelectArea={navTo} />
          ) : view === 'escalas' ? (
            /* ─── ESCALAS ─── */
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
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-xl px-3 py-2" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <button onClick={prevMonth} className="w-6 h-6 flex items-center justify-center rounded text-lg font-light transition-colors" style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>‹</button>
                    <span className="text-xs font-semibold tracking-wider uppercase min-w-[80px] text-center" style={{ color: 'var(--text-primary)' }}>
                      {MESES_PT[month - 1].slice(0, 3)} {year}
                    </span>
                    <button onClick={nextMonth} className="w-6 h-6 flex items-center justify-center rounded text-lg font-light transition-colors" style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>›</button>
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
              {loading ? (
                <div className="flex flex-col gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton rounded-2xl h-32" style={{ animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              ) : eventosSorted.length === 0 ? (
                <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
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
          ) : (
            /* ─── HOME / WELCOME ─── */
            <WelcomeHome onNavigate={navTo} voluntariosCount={volCounts} />
          )}
        </div>
      </main>

      {/* Tutorial */}
      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}

      {/* Modal: Adicionar Evento */}
      {showAddEvento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowAddEvento(false); }}>
          <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5 modal-content" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Novo Evento</h2>
              <button onClick={() => setShowAddEvento(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-xl" style={{ color: 'var(--text-secondary)' }}>×</button>
            </div>
            <form onSubmit={handleAddEvento} className="flex flex-col gap-4">
              {[
                { key: 'data', label: 'Data', type: 'date', placeholder: '' },
                { key: 'titulo', label: 'Título', type: 'text', placeholder: 'Ex: Culto Regular' },
                { key: 'descricao', label: 'Descrição (opcional)', type: 'text', placeholder: 'Ex: Domingo, Especial...' },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{label}</label>
                  <input type={type} value={novoEvento[key as keyof NovoEventoForm]}
                    onChange={e => setNovoEvento(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder} required={key !== 'descricao'}
                    className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-card-2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
              ))}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAddEvento(false)} className="flex-1 rounded-xl py-3 text-sm font-semibold" style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Cancelar</button>
                <button type="submit" className="flex-1 rounded-xl py-3 text-sm font-bold transition-opacity hover:opacity-90" style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}>Criar Evento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar exclusão */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
          onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(null); }}>
          <div className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5 modal-content" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div>
              <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Excluir Evento</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Esta ação não pode ser desfeita.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-xl py-3 text-sm font-semibold" style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Cancelar</button>
              <button onClick={async () => {
                try { await removeEvento(confirmDelete); await refreshEscalas(); } catch (err) { console.error(err); }
                setConfirmDelete(null);
              }} className="flex-1 rounded-xl py-3 text-sm font-bold text-white" style={{ backgroundColor: '#EF4444' }}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Welcome Home ────────────────────────────────────────────────────────────
function WelcomeHome({ onNavigate, voluntariosCount }: { onNavigate: (v: string) => void; voluntariosCount: Record<string, number> }) {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* ── Hero card com bg-design ── */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ minHeight: '210px', backgroundColor: '#0A0A0D', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Background image — right portion */}
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: '60%',
          backgroundImage: 'url(/bg-design.png)',
          backgroundSize: 'cover', backgroundPosition: 'center left',
        }} />
        {/* Gradient overlay left-to-right */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, #0A0A0D 42%, rgba(10,10,13,0.85) 62%, rgba(10,10,13,0.1) 100%)',
        }} />
        {/* Content */}
        <div className="relative z-10 px-8 py-10">
          <img src="/logo-connect.png" alt="Connect" style={{ height: '24px', width: 'auto', marginBottom: '20px', opacity: 0.9 }} />
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Ministério de Mídia · IPAN SP · 2026
          </p>
          <h1 className="font-black leading-none mb-3" style={{ color: '#FFFFFF', fontSize: 'clamp(2rem,5vw,3rem)' }}>
            Bem-vindo 👋
          </h1>
          <p className="text-sm font-light" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Gerencie escalas, voluntários e agenda do ministério.
          </p>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Áreas', value: '8', sub: 'no ministério' },
          { label: 'Eventos Jun', value: '9', sub: 'neste mês' },
          { label: 'Módulos', value: '3', sub: 'disponíveis' },
        ].map(({ label, value, sub }) => (
          <div
            key={label}
            className="rounded-2xl p-5"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="font-black text-3xl leading-none" style={{ color: 'var(--text-primary)' }}>{value}</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Versículo ── */}
      <div
        className="rounded-2xl px-7 py-6 relative overflow-hidden"
        style={{ backgroundColor: '#080810', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <span className="absolute right-4 top-0 text-8xl font-serif leading-none select-none pointer-events-none" style={{ color: 'rgba(255,255,255,0.04)' }}>"</span>
        <p className="text-[9px] font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>Palavra</p>
        <p className="text-sm sm:text-base font-light leading-relaxed italic" style={{ color: 'rgba(255,255,255,0.75)' }}>
          "Tudo o que fizerem, façam de todo o coração, como para o Senhor, e não para os homens, sabendo que receberão do Senhor a recompensa da herança, pois é a Cristo, o Senhor, a quem vocês estão servindo."
        </p>
        <p className="text-xs font-semibold mt-4" style={{ color: 'rgba(255,255,255,0.28)' }}>— Colossenses 3:23-24</p>
      </div>

      {/* ── Áreas ── */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
          Áreas do Ministério
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger">
          {AREAS.map(area => {
            const cor = area.cor === '#FFFFFF' ? '#888888' : area.cor;
            return (
              <button
                key={area.id}
                onClick={() => onNavigate(area.id)}
                className="text-left rounded-2xl p-4 transition-all"
                style={{ backgroundColor: 'var(--bg-card)', border: `1px solid rgba(255,255,255,0.06)` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${cor}55`; e.currentTarget.style.backgroundColor = `${cor}0A`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.backgroundColor = 'var(--bg-card)'; }}
              >
                <p className="font-bold text-sm leading-tight mb-3" style={{ color: 'var(--text-primary)' }}>{area.nome}</p>
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cor }} />
                    <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{area.colider}</p>
                  </div>
                  <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {voluntariosCount[area.id] ?? 0}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Nav button helper ───────────────────────────────────────────────────────
function NavBtn({
  id, icon, label, currentView, onNav, area,
}: {
  id: string;
  icon?: string;
  label: string;
  currentView: string;
  onNav: (v: string) => void;
  area?: { cor: string };
}) {
  const active = currentView === id;
  const cor = area?.cor && area.cor !== '#FFFFFF' ? area.cor : 'rgba(255,255,255,0.4)';

  return (
    <button
      onClick={() => onNav(id)}
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs w-full transition-all duration-150"
      style={{
        backgroundColor: active ? 'rgba(255,255,255,0.08)' : 'transparent',
        color: active ? '#FFFFFF' : 'rgba(255,255,255,0.42)',
        fontWeight: active ? 600 : 400,
        borderLeft: active ? `2px solid ${area ? cor : 'rgba(255,255,255,0.5)'}` : '2px solid transparent',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.42)'; } }}
    >
      {area ? (
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: active ? cor : 'rgba(255,255,255,0.2)' }} />
      ) : (
        <span className="text-sm flex-shrink-0 w-4 text-center">{icon}</span>
      )}
      <span className="truncate">{label}</span>
    </button>
  );
}
