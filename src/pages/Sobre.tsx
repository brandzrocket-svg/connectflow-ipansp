import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import Header from '../components/layout/Header';
import { AREAS } from '../constants/areas';

const MANDAMENTOS = [
  'Farás tudo como para o Senhor',
  'Honrarás o horário como honras o altar',
  'Comunicarás tua ausência com antecedência',
  'Cuidarás dos equipamentos como se fossem teus',
  'Vestirás a identidade do ministério',
  'Manterás conduta íntegra dentro e fora da igreja',
  'Participarás dos treinamentos e reuniões de equipe',
  'Respeitarás a liderança e as decisões do ministério',
  'Servirás com humildade, sem buscar protagonismo',
  'Dependerás do Espírito Santo acima de todo talento',
];

const CULTURA = [
  { titulo: 'Excelência', descricao: 'Fazer tudo com máxima qualidade, como para o Senhor.' },
  { titulo: 'Disciplina', descricao: 'Comprometimento com horários e responsabilidades.' },
  { titulo: 'Serviço', descricao: 'Servir com humildade e amor para com nossa missão.' },
  { titulo: 'Unidade', descricao: 'Trabalhar em equipe com respeito e colaboração.' },
  { titulo: 'Adoração', descricao: 'Somos adoradores, atraímos a presença através da excelência.' },
  { titulo: 'Fé', descricao: 'Tudo feito com inspiração do Espírito Santo.' },
];

const STEPS = [
  { num: '01', titulo: 'Divulgação da Vaga' },
  { num: '02', titulo: 'Entrevista' },
  { num: '03', titulo: 'Período de Observação (30 dias)' },
  { num: '04', titulo: 'Integração Oficial' },
];

export default function Sobre() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Header
        user={user ? { email: user.email ?? '', nome: user.email ?? '' } : null}
        onLoginClick={() => navigate('/login')}
        onLogout={logout}
        theme={theme}
        onToggleTheme={toggleTheme}
        onNavTo={() => navigate('/')}
        currentView="sobre"
        onStartTutorial={() => {}}
      />

      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        {/* Botão voltar */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-500 hover:text-white text-sm font-medium transition-colors mb-8 group"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          Dashboard
        </button>

        {/* HERO */}
        <div
          className="rounded-2xl p-10 text-center mb-6"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="text-5xl font-light tracking-tight mb-3" style={{ color: 'var(--text-primary)' }}>
            <span className="font-light">connect</span>
            <span className="font-black">ipan</span>
          </div>
          <p className="text-sm font-semibold tracking-widest uppercase mb-6" style={{ color: 'var(--text-secondary)' }}>
            Ministério de Mídia · IPAN São Paulo · 2026
          </p>
          <div
            className="inline-block rounded-xl px-5 py-3 text-sm italic"
            style={{ backgroundColor: 'var(--bg-card-2)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
          >
            "Tudo o que fizerem, façam de todo o coração, como para o Senhor" — Colossenses 3:23-24
          </div>
        </div>

        {/* VISÃO E OBJETIVO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div
            className="rounded-2xl p-6"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-secondary)' }}>Visão</p>
            <p className="font-semibold text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              Despertar dons e talentos de mídia através da excelência e disciplina no Espírito Santo.
            </p>
          </div>
          <div
            className="rounded-2xl p-6"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-secondary)' }}>Objetivo</p>
            <p className="font-semibold text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              Ser um amplificador das boas novas de Cristo proclamadas na IPAN SP.
            </p>
          </div>
        </div>

        {/* LIDERANÇA */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: 'var(--text-secondary)' }}>Liderança</p>

          {/* Líderes principais */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div
              className="flex-1 rounded-xl px-4 py-3"
              style={{ backgroundColor: 'var(--bg-card-2)', border: '1px solid var(--border-color)' }}
            >
              <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Paulo Aguiar</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Líder do Connect</p>
            </div>
            <div
              className="flex-1 rounded-xl px-4 py-3"
              style={{ backgroundColor: 'var(--bg-card-2)', border: '1px solid var(--border-color)' }}
            >
              <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Nathali Sprocatti</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Conselho</p>
            </div>
          </div>

          {/* Co-líderes grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {AREAS.map(area => (
              <div
                key={area.id}
                className="rounded-xl px-4 py-3"
                style={{ backgroundColor: 'var(--bg-card-2)', border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: area.cor === '#FFFFFF' ? '#888' : area.cor }} />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{area.nome}</span>
                </div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{area.colider}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CULTURA */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: 'var(--text-secondary)' }}>Cultura do Ministério</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger animate-fade-in">
            {CULTURA.map(item => (
              <div
                key={item.titulo}
                className="rounded-xl p-4"
                style={{ backgroundColor: 'var(--bg-card-2)', border: '1px solid var(--border-color)' }}
              >
                <p className="font-black text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{item.titulo}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.descricao}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AS ÁREAS */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: 'var(--text-secondary)' }}>As Áreas</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger animate-fade-in">
            {AREAS.map(area => {
              const cor = area.cor === '#FFFFFF' ? '#888888' : area.cor;
              return (
                <div
                  key={area.id}
                  className="rounded-xl p-4 cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: 'var(--bg-card-2)', border: `1px solid ${cor}40` }}
                  onClick={() => navigate(`/area/${area.id}`)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cor }} />
                  </div>
                  <p className="font-black text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>{area.nome}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{area.colider}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* OS 10 MANDAMENTOS */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{ backgroundColor: '#000000', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-5 text-gray-500">
            Os 10 Mandamentos do Connect
          </p>
          <ol className="flex flex-col gap-3">
            {MANDAMENTOS.map((m, i) => (
              <li key={i} className="flex items-start gap-4">
                <span
                  className="text-xs font-black w-6 flex-shrink-0 mt-0.5"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-sm font-medium text-white leading-relaxed">{m}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* PROCESSO DE RECRUTAMENTO */}
        <div
          className="rounded-2xl p-6 mb-8"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: 'var(--text-secondary)' }}>
            Processo de Recrutamento
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STEPS.map(step => (
              <div
                key={step.num}
                className="rounded-xl p-4 text-center"
                style={{ backgroundColor: 'var(--bg-card-2)', border: '1px solid var(--border-color)' }}
              >
                <p className="text-2xl font-black mb-2" style={{ color: 'rgba(255,255,255,0.15)' }}>{step.num}</p>
                <p className="text-xs font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>{step.titulo}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
