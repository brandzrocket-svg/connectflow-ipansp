import { useState, useEffect, useCallback } from 'react'
import { getEventosByMonth, saveEvento, deleteEvento } from '../lib/storage'
import type { Evento } from '../types'

export function useEventos(year: number, month: number) {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getEventosByMonth(year, month)
      setEventos(data)
    } catch (err) {
      console.error('Erro ao carregar eventos:', err)
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { refresh() }, [refresh])

  async function addEvento(data: string, titulo: string, descricao?: string) {
    await saveEvento({ data, titulo, descricao })
    refresh()
  }

  async function removeEvento(id: string) {
    await deleteEvento(id)
    refresh()
  }

  return { eventos, addEvento, removeEvento, refresh, loading }
}
