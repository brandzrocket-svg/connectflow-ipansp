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
  user: { email: string; nome: string } | null;
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

  useEffect(() => {
    if (!eventoId && eventos.length > 0) {
      setEventoId(eventos[0].id);
    }
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
    if (e.key === 'Enter') {
      e.preventDefault();
      adicionarVoluntario();
    }
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 flex flex-col gap-5 shadow-2xl"
        style={{ backgroundColor: '#1A1A1A', border: '1px solid #333333' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">
              {escalaExistente ? 'Editar Escala' : 'Nova Escala'}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: areaCor }}>
              {areaNome}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-xl"
          >
            ×
          </button>
        </div>

        {/* Evento */}
        <div className="flex flex-col gap-1.5">
          <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
            Evento
          </label>
          <select
            value={eventoId}
            onChange={e => setEventoId(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-white text-sm appearance-none cursor-pointer focus:outline-none"
            style={{
              backgroundColor: '#2A2A2A',
              border: '1px solid #333333',
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
          <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
            Voluntários
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={novoVoluntario}
              onChange={e => setNovoVoluntario(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nome do voluntário..."
              className="flex-1 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none"
              style={{
                backgroundColor: '#2A2A2A',
                border: '1px solid #333333',
              }}
            />
            <button
              onClick={adicionarVoluntario}
              className="rounded-xl px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: areaCor === '#FFFFFF' ? '#555555' : areaCor }}
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
                  cor={areaCor === '#FFFFFF' ? '#888888' : areaCor}
                  onRemove={() => removerVoluntario(nome)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Observações */}
        <div className="flex flex-col gap-1.5">
          <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
            Observações
          </label>
          <textarea
            value={observacao}
            onChange={e => setObservacao(e.target.value)}
            placeholder="Notas, instruções especiais..."
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none resize-none"
            style={{
              backgroundColor: '#2A2A2A',
              border: '1px solid #333333',
            }}
          />
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl py-3 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
            style={{ border: '1px solid #333333' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!eventoId}
            className="flex-1 rounded-xl py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{
              backgroundColor: areaCor === '#FFFFFF' ? '#555555' : areaCor,
              color: areaCor === '#FFFFFF' ? '#ffffff' : '#000000',
            }}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
