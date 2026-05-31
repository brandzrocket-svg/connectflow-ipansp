import type { Escala, Evento, Area } from '../../types';
import VoluntarioTag from '../shared/VoluntarioTag';

interface EscalaCardProps {
  escala: Escala;
  evento: Evento;
  area: Area;
  isAuthenticated: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function formatData(dataISO: string): string {
  const d = new Date(dataISO + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    weekday: 'long',
    year: 'numeric',
  });
}

export default function EscalaCard({ escala, evento, area, isAuthenticated, onEdit, onDelete }: EscalaCardProps) {
  const cor = area.cor === '#FFFFFF' ? '#888888' : area.cor;

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.18)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider capitalize" style={{ color: 'var(--text-secondary)' }}>
            {formatData(evento.data)}
          </p>
          <h3 className="font-bold text-base mt-0.5" style={{ color: 'var(--text-primary)' }}>
            {evento.titulo}
          </h3>
        </div>
        {isAuthenticated && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={onEdit}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              Editar
            </button>
            <button
              onClick={onDelete}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              Excluir
            </button>
          </div>
        )}
      </div>

      {/* Voluntários */}
      {escala.voluntarios.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {escala.voluntarios.map(nome => (
            <VoluntarioTag key={nome} nome={nome} cor={cor} />
          ))}
        </div>
      ) : (
        <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>Nenhum voluntário adicionado</p>
      )}

      {/* Observação */}
      {escala.observacao && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            backgroundColor: 'var(--bg-card-2)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
          }}
        >
          <span className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
            Observação
          </span>
          {escala.observacao}
        </div>
      )}

      {/* Data de atualização */}
      {escala.atualizado_em && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Atualizado em{' '}
          {new Date(escala.atualizado_em).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}
    </div>
  );
}
