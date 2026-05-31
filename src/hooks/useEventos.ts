import { useState, useCallback } from 'react';
import { getEventosByMonth, saveEvento, deleteEvento } from '../lib/storage';
import type { Evento } from '../types';

export function useEventos(year: number, month: number) {
  const [eventos, setEventos] = useState<Evento[]>(() => getEventosByMonth(year, month));

  const refresh = useCallback(() => {
    setEventos(getEventosByMonth(year, month));
  }, [year, month]);

  function addEvento(data: string, titulo: string, descricao?: string) {
    saveEvento({ data, titulo, descricao });
    refresh();
  }

  function removeEvento(id: string) {
    deleteEvento(id);
    refresh();
  }

  return { eventos, addEvento, removeEvento, refresh };
}
