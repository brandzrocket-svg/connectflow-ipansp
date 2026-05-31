import { useState, useCallback } from 'react';
import { getEscalas, getEscalasByArea, upsertEscala, deleteEscala } from '../lib/storage';
import type { Escala } from '../types';

export function useEscalas(areaId?: string) {
  const [escalas, setEscalas] = useState<Escala[]>(() =>
    areaId ? getEscalasByArea(areaId) : getEscalas()
  );

  const refresh = useCallback(() => {
    setEscalas(areaId ? getEscalasByArea(areaId) : getEscalas());
  }, [areaId]);

  function saveEscala(data: Omit<Escala, 'id' | 'atualizado_em'>) {
    upsertEscala(data);
    refresh();
  }

  function removeEscala(id: string) {
    deleteEscala(id);
    refresh();
  }

  return { escalas, saveEscala, removeEscala, refresh };
}
