import { useState } from 'react';

interface TutorialStep {
  titulo: string;
  descricao: string;
  emoji: string;
  dica?: string;
}

const STEPS: TutorialStep[] = [
  {
    emoji: '📅',
    titulo: 'Vendo os Eventos do Mês',
    descricao: 'Na tela inicial você vê todos os eventos cadastrados para o mês. Cada card mostra as escalas preenchidas por área. Para mudar o mês, use o filtro ← → dentro de cada área.',
    dica: 'Os eventos ficam organizados por data automaticamente.',
  },
  {
    emoji: '✍️',
    titulo: 'Cadastrando uma Escala',
    descricao: 'Clique em uma área na barra lateral (ex: Social Media). Na tela da área, clique em "+ Escala". Selecione o evento, adicione os nomes dos voluntários e salve.',
    dica: 'Você pode editar ou excluir uma escala a qualquer momento.',
  },
  {
    emoji: '📋',
    titulo: 'Visualizando a Agenda',
    descricao: 'Na Visão Geral (ícone 📊 na sidebar), você encontra o calendário completo da Igreja com todos os eventos de Jun–Dez 2026 e uma fila dos próximos cultos.',
    dica: 'Arraste os blocos da Visão Geral para reorganizar na ordem que preferir.',
  },
  {
    emoji: '👥',
    titulo: 'Cadastrando Voluntários',
    descricao: 'Dentro de cada área, role até a seção "Voluntários". Digite o nome no campo e clique em "+ Adicionar". Os voluntários ficam salvos e disponíveis na escala.',
    dica: 'Para remover um voluntário, clique no ✕ ao lado do nome.',
  },
  {
    emoji: '📣',
    titulo: 'Enviando Reports ao Líder',
    descricao: 'Dentro de cada área, role até "Reportar para o Líder". Descreva uma observação, necessidade ou ocorrência e clique em "Enviar Report". O líder verá na Visão Geral.',
    dica: 'Reports aparecem na Visão Geral com destaque para os não lidos.',
  },
  {
    emoji: '💡',
    titulo: 'Enviando Sugestões de Melhoria',
    descricao: 'Dentro de cada área, role até "Sugestões de Melhoria". Compartilhe ideias para melhorar o app ou a área. Todas as sugestões chegam ao líder na Visão Geral.',
    dica: 'Qualquer voluntário pode enviar sugestões — sem precisar de login!',
  },
];

interface TutorialProps {
  onClose: () => void;
}

export default function Tutorial({ onClose }: TutorialProps) {
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl flex flex-col modal-content overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        {/* Progress bar */}
        <div className="h-1 w-full" style={{ backgroundColor: 'var(--bg-card-2)' }}>
          <div
            className="h-1 transition-all duration-300"
            style={{
              width: `${((step + 1) / STEPS.length) * 100}%`,
              backgroundColor: '#22C55E',
            }}
          />
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Passo {step + 1} de {STEPS.length}
            </span>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-card-2)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              ×
            </button>
          </div>

          <div className="text-4xl">{current.emoji}</div>

          <div>
            <h2 className="font-black text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
              {current.titulo}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {current.descricao}
            </p>
          </div>

          {current.dica && (
            <div
              className="rounded-xl px-4 py-3 text-xs leading-relaxed"
              style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22C55E' }}
            >
              💡 {current.dica}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={isFirst}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-30 transition-colors"
              style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            >
              ← Anterior
            </button>

            {/* Dots */}
            <div className="flex gap-1.5 flex-1 justify-center">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className="rounded-full transition-all duration-200"
                  style={{
                    width: i === step ? '20px' : '6px',
                    height: '6px',
                    backgroundColor: i === step ? '#22C55E' : 'var(--border-color)',
                  }}
                />
              ))}
            </div>

            {isLast ? (
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#22C55E', color: '#000' }}
              >
                Concluir ✓
              </button>
            ) : (
              <button
                onClick={() => setStep(s => s + 1)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}
              >
                Próximo →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

