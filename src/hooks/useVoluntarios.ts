import { useState, useEffect } from 'react'
import { getVoluntariosByArea, createVoluntario, deleteVoluntario } from '../lib/storage'
import type { Voluntario } from '../types'

export function useVoluntarios(areaId: string) {
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([])
  const [loading, setLoading] = useState(true)

  async function refresh() {
    setLoading(true)
    const data = await getVoluntariosByArea(areaId)
    setVoluntarios(data)
    setLoading(false)
  }

  useEffect(() => { if (areaId) refresh() }, [areaId])

  async function addVoluntario(nome: string) {
    await createVoluntario({ area_id: areaId, nome, ativo: true })
    refresh()
  }

  async function removeVoluntario(id: string) {
    await deleteVoluntario(id)
    refresh()
  }

  return { voluntarios, loading, addVoluntario, removeVoluntario, refresh }
}
