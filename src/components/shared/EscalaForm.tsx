import { useState, useEffect } from 'react';
import type { Evento, Escala } from '../../types';
import VoluntarioTag from './VoluntarioTag';

interface EscalaFormProps {
  eventos: Evento[];
  areaId: string;
  areaCor: string;
  areaNome: string;
  escalaExistente?: Escala;
  onSave: (data: Omit<Escala, 'id' | 'atualizado_em'>) => void;
  onClose: () => void;
  user: { email: string } | null;
}

function formatDataEvento(dataISO: string, titulo: string): string {
  const d = new Date(dataISO + 'T00:00:00');
  const dataFmt = d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    weekday: 'long',
  });
  return `${dataFmt} — ${titulo}`;
}

export default function EscalaForm({
  eventos,
  areaId,
  areaCor,
  areaNome,
  escalaExistente,
  onSave,
  onClose,
  user,
}: EscalaFormProps) {
  const [eventoId, setEventoId] = useState(escalaExistente?.evento_id ?? eventos[0]?.id ?? '');
  const [voluntarios, setVoluntarios] = useState<string[]>(escalaExistente?.voluntarios ?? []);
  const [novoVoluntario, setNovoVoluntario] = useState('');
  const [observacao, setObservacao] = useState(escalaExistente?.observacao ?? '');
  const cor = areaCor === '#FFFFFF' ? '#555555' : areaCor;

  useEffect(() => {
    if (!eventoId && eventos.length > 0) setEventoId(eventos[0].id);
  }, [eventos, eventoId]);

  function adicionarVoluntario() {
    const nome = novoVoluntario.trim();
    if (nome && !voluntarios.includes(nome)) {
      setVoluntarios(prev => [...prev, nome]);
      setNovoVoluntario('');
    }
  }

  function removerVoluntario(nome: string) {
    setVoluntarios(prev => prev.filter(v => v !== nome));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); adicionarVoluntario(); }
  }

  function handleSave() {
    if (!eventoId) return;
    onSave({
      evento_id: eventoId,
      area_id: areaId,
      voluntarios,
      observacao: observacao || undefined,
      criado_por: user?.email,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 flex flex-col gap-5 shadow-2xl modal-content"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              {escalaExistente ? 'Editar Escala' : 'Nova Escala'}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: cor }}>
              {areaNome}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-xl transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-card-2)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            ×
          </button>
        </div>

        {/* Evento */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            Evento
          </label>
          <select
            value={eventoId}
            onChange={e => setEventoId(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm appearance-none cursor-pointer focus:outline-none"
            style={{
              backgroundColor: 'var(--bg-card-2)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            {eventos.map(ev => (
              <option key={ev.id} value={ev.id}>
                {formatDataEvento(ev.data, ev.titulo)}
              </option>
            ))}
          </select>
        </div>

        {/* Voluntários */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            Voluntários
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={novoVoluntario}
              onChange={e => setNovoVoluntario(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nome do voluntário..."
              className="flex-1 rounded-xl px-4 py-3 text-sm focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-card-2)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              onClick={adicionarVoluntario}
              className="rounded-xl px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ backgroundColor: cor, color: '#fff' }}
            >
              + Adicionar
            </button>
          </div>
          {voluntarios.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {voluntarios.map(nome => (
                <VoluntarioTag
                  key={nome}
                  nome={nome}
                  cor={cor}
                  onRemove={() => removerVoluntario(nome)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Observações */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            Observações
          </label>
          <textarea
            value={observacao}
            onChange={e => setObservacao(e.target.value)}
            placeholder="Notas, instruções especiais..."
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none resize-none"
            style={{
              backgroundColor: 'var(--bg-card-2)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl py-3 text-sm font-semibold transition-colors"
            style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!eventoId}
            className="flex-1 rounded-xl py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: cor, color: '#fff' }}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
