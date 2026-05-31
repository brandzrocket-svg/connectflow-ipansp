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
      style={{ backgroundColor: '#1A1A1A', border: '1px solid #333333' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider capitalize">
            {formatData(evento.data)}
          </p>
          <h3 className="text-white font-bold text-base mt-0.5">{evento.titulo}</h3>
        </div>
        {isAuthenticated && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={onEdit}
              className="text-gray-400 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ border: '1px solid #333333' }}
            >
              Editar
            </button>
            <button
              onClick={onDelete}
              className="text-red-400 hover:text-red-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ border: '1px solid rgba(239,68,68,0.3)' }}
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
        <p className="text-gray-600 text-sm italic">Nenhum voluntário adicionado</p>
      )}

      {/* Observação */}
      {escala.observacao && (
        <div
          className="rounded-xl px-4 py-3 text-sm text-gray-400"
          style={{ backgroundColor: '#2A2A2A', border: '1px solid #333333' }}
        >
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
            Observação
          </span>
          {escala.observacao}
        </div>
      )}

      {/* Data de atualização */}
      {escala.atualizado_em && (
        <p className="text-gray-600 text-xs">
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
