import { useState, useEffect } from 'react'
import { getReports, createReport, marcarReportLido } from '../lib/storage'
import type { Report } from '../types'

export function useReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  async function refresh() {
    setLoading(true)
    const data = await getReports()
    setReports(data)
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  async function addReport(areaId: string, mensagem: string, criadoPor: string) {
    await createReport({ area_id: areaId, mensagem, criado_por: criadoPor })
    refresh()
  }

  async function marcarLido(id: string) {
    await marcarReportLido(id)
    refresh()
  }

  return { reports, loading, addReport, marcarLido, refresh }
}
