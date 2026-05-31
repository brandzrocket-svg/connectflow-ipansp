import { useState, useEffect, useCallback } from 'react'
import { getEscalas, getEscalasByArea, upsertEscala, deleteEscala } from '../lib/storage'
import type { Escala } from '../types'

export function useEscalas(areaId?: string) {
  const [escalas, setEscalas] = useState<Escala[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const data = areaId ? await getEscalasByArea(areaId) : await getEscalas()
    setEscalas(data)
    setLoading(false)
  }, [areaId])

  useEffect(() => { refresh() }, [refresh])

  async function saveEscala(data: Omit<Escala, 'id' | 'atualizado_em'>) {
    await upsertEscala(data)
    refresh()
  }

  async function removeEscala(id: string) {
    await deleteEscala(id)
    refresh()
  }

  return { escalas, saveEscala, removeEscala, refresh, loading }
}
