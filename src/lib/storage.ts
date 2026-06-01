import { supabase } from './supabase'
import type { Evento, Escala, Report, Voluntario } from '../types'

export async function getEventosByMonth(year: number, month: number): Promise<Evento[]> {
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const to = `${year}-${String(month).padStart(2, '0')}-31`
  const { data, error } = await supabase
    .from('eventos')
    .select('*')
    .gte('data', from)
    .lte('data', to)
    .order('data', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function saveEvento(evento: Omit<Evento, 'id'>): Promise<Evento> {
  const { data, error } = await supabase
    .from('eventos')
    .insert(evento)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteEvento(id: string): Promise<void> {
  const { error } = await supabase.from('eventos').delete().eq('id', id)
  if (error) throw error
}

export async function getAllEventos(): Promise<Evento[]> {
  const { data, error } = await supabase
    .from('eventos')
    .select('*')
    .order('data', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getEscalas(): Promise<Escala[]> {
  const { data, error } = await supabase.from('escalas').select('*')
  if (error) throw error
  return data ?? []
}

export async function getEscalasByArea(areaId: string): Promise<Escala[]> {
  const { data, error } = await supabase
    .from('escalas')
    .select('*')
    .eq('area_id', areaId)
  if (error) throw error
  return data ?? []
}

export async function getEscalasByEvento(eventoId: string): Promise<Escala[]> {
  const { data, error } = await supabase
    .from('escalas')
    .select('*')
    .eq('evento_id', eventoId)
  if (error) throw error
  return data ?? []
}

export async function upsertEscala(escala: Omit<Escala, 'id' | 'atualizado_em'>): Promise<Escala> {
  // Check if a record already exists for this (evento_id, area_id) pair
  const { data: existing } = await supabase
    .from('escalas')
    .select('id')
    .eq('evento_id', escala.evento_id)
    .eq('area_id', escala.area_id)
    .maybeSingle()

  if (existing?.id) {
    const { data, error } = await supabase
      .from('escalas')
      .update({ ...escala, atualizado_em: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('escalas')
    .insert({ ...escala, atualizado_em: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteEscala(id: string): Promise<void> {
  const { error } = await supabase.from('escalas').delete().eq('id', id)
  if (error) throw error
}

export async function getReports(): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('criado_em', { ascending: false })
    .limit(20)
  if (error) return []
  return data ?? []
}

export async function createReport(report: Omit<Report, 'id' | 'criado_em' | 'lido'>): Promise<void> {
  await supabase.from('reports').insert({ ...report, lido: false })
}

export async function marcarReportLido(id: string): Promise<void> {
  await supabase.from('reports').update({ lido: true }).eq('id', id)
}

export async function getVoluntariosByArea(areaId: string): Promise<Voluntario[]> {
  const { data, error } = await supabase
    .from('voluntarios')
    .select('*')
    .eq('area_id', areaId)
    .eq('ativo', true)
    .order('nome', { ascending: true })
  if (error) return []
  return data ?? []
}

export async function createVoluntario(v: Omit<Voluntario, 'id' | 'criado_em'>): Promise<void> {
  const { error } = await supabase.from('voluntarios').insert({ ...v, criado_em: new Date().toISOString() })
  if (error) throw error
}

export async function deleteVoluntario(id: string): Promise<void> {
  await supabase.from('voluntarios').update({ ativo: false }).eq('id', id)
}

export async function getVoluntariosCountByArea(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('voluntarios')
    .select('area_id')
    .eq('ativo', true)
  if (error || !data) return {}
  const counts: Record<string, number> = {}
  for (const row of data) {
    counts[row.area_id] = (counts[row.area_id] ?? 0) + 1
  }
  return counts
}
