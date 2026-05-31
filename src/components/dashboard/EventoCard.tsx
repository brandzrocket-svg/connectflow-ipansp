import type { Evento, Escala, Area } from '../../types';
import StatusBadge from '../shared/StatusBadge';

interface EventoCardProps {
  evento: Evento;
  escalas: Escala[];
  areas: Area[];
}

function formatData(dataISO: string): { dia: string; diaSemana: string } {
  const d = new Date(dataISO + 'T00:00:00');
  const dia = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const diaSemana = d.toLocaleDateString('pt-BR', { weekday: 'long' });
  const diaSemanaCapitalized = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
  return { dia, diaSemana: diaSemanaCapitalized };
}

export default function EventoCard({ evento, escalas, areas }: EventoCardProps) {
  const { dia, diaSemana } = formatData(evento.data);
  const escalasDoEvento = escalas.filter(e => e.evento_id === evento.id);
  const escalasPreenchidas = areas.filter(area =>
    escalasDoEvento.some(e => e.area_id === area.id && e.voluntarios.length > 0)
  ).length;

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
    >
      {/* Header do evento */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
            {dia} · {diaSemana}
          </p>
          <h3 className="text-white font-bold text-base mt-0.5">{evento.titulo}</h3>
          {evento.descricao && (
            <p className="text-gray-500 text-xs mt-0.5">{evento.descricao}</p>
          )}
        </div>
        <StatusBadge totalAreas={areas.length} escalasPreenchidas={escalasPreenchidas} />
      </div>

      {/* Lista de áreas */}
      <div className="flex flex-col gap-2">
        {areas.map(area => {
          const escala = escalasDoEvento.find(e => e.area_id === area.id);
          const voluntarios = escala?.voluntarios ?? [];

          return (
            <div
              key={area.id}
              className="flex items-start gap-3 py-2 border-t"
              style={{ borderColor: 'var(--bg-card-2)' }}
            >
              <div className="flex items-center gap-2 min-w-[160px] flex-shrink-0">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: area.cor }}
                />
                <span className="text-gray-300 text-sm font-medium">{area.nome}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 flex-1">
                {voluntarios.length > 0 ? (
                  voluntarios.map(v => (
                    <span
                      key={v}
                      className="text-xs text-gray-300 px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'var(--bg-card-2)' }}
                    >
                      {v}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-600 text-sm">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
