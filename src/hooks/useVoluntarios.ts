import { useState, useEffect, useCallback } from 'react'
import { getVoluntariosByArea, createVoluntario, deleteVoluntario } from '../lib/storage'
import type { Voluntario } from '../types'

export function useVoluntarios(areaId: string) {
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!areaId) return
    setLoading(true)
    setError(null)
    const data = await getVoluntariosByArea(areaId)
    setVoluntarios(data)
    setLoading(false)
  }, [areaId])

  useEffect(() => { if (areaId) refresh() }, [areaId, refresh])

  async function addVoluntario(nome: string) {
    try {
      await createVoluntario({ area_id: areaId, nome, ativo: true })
      await refresh()
    } catch (err) {
      console.error('Erro ao criar voluntário:', err)
      setError('Não foi possível salvar o voluntário. Verifique se a tabela existe no Supabase.')
      setTimeout(() => setError(null), 5000)
    }
  }

  async function removeVoluntario(id: string) {
    try {
      await deleteVoluntario(id)
      await refresh()
    } catch (err) {
      console.error('Erro ao remover voluntário:', err)
    }
  }

  return { voluntarios, loading, error, addVoluntario, removeVoluntario, refresh }
}
