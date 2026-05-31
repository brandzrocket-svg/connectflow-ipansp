import type { Evento, Escala } from '../types';

const EVENTOS_KEY = 'connectflow_eventos';
const ESCALAS_KEY = 'connectflow_escalas';
const AUTH_KEY = 'connectflow_auth';

// Seed de eventos de junho 2026 (domingos + quarta)
const SEED_EVENTOS: Evento[] = [
  { id: 'e1', data: '2026-06-07', titulo: 'Culto Regular', descricao: 'Domingo' },
  { id: 'e2', data: '2026-06-14', titulo: 'Culto Regular', descricao: 'Domingo' },
  { id: 'e3', data: '2026-06-21', titulo: 'Culto Regular', descricao: 'Domingo' },
  { id: 'e4', data: '2026-06-28', titulo: 'Culto Regular', descricao: 'Domingo' },
];

function initEventos(): Evento[] {
  const stored = localStorage.getItem(EVENTOS_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(EVENTOS_KEY, JSON.stringify(SEED_EVENTOS));
  return SEED_EVENTOS;
}

export function getEventos(): Evento[] {
  return initEventos();
}

export function getEventosByMonth(year: number, month: number): Evento[] {
  return getEventos().filter(e => {
    const d = new Date(e.data + 'T00:00:00');
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
}

export function saveEvento(evento: Omit<Evento, 'id'>): Evento {
  const eventos = getEventos();
  const novo: Evento = { ...evento, id: `e${Date.now()}` };
  localStorage.setItem(EVENTOS_KEY, JSON.stringify([...eventos, novo]));
  return novo;
}

export function deleteEvento(id: string): void {
  const eventos = getEventos().filter(e => e.id !== id);
  localStorage.setItem(EVENTOS_KEY, JSON.stringify(eventos));
}

export function getEscalas(): Escala[] {
  const stored = localStorage.getItem(ESCALAS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function getEscalasByArea(areaId: string): Escala[] {
  return getEscalas().filter(e => e.area_id === areaId);
}

export function getEscalasByEvento(eventoId: string): Escala[] {
  return getEscalas().filter(e => e.evento_id === eventoId);
}

export function upsertEscala(escala: Omit<Escala, 'id' | 'atualizado_em'>): Escala {
  const escalas = getEscalas();
  const existing = escalas.findIndex(
    e => e.evento_id === escala.evento_id && e.area_id === escala.area_id
  );
  const updated: Escala = {
    ...escala,
    id: existing >= 0 ? escalas[existing].id : `esc${Date.now()}`,
    atualizado_em: new Date().toISOString(),
  };
  if (existing >= 0) escalas[existing] = updated;
  else escalas.push(updated);
  localStorage.setItem(ESCALAS_KEY, JSON.stringify(escalas));
  return updated;
}

export function deleteEscala(id: string): void {
  const escalas = getEscalas().filter(e => e.id !== id);
  localStorage.setItem(ESCALAS_KEY, JSON.stringify(escalas));
}

// Auth simples
export function login(email: string, senha: string): boolean {
  // Credenciais hardcoded para MVP
  const valido = email === 'admin@connectipan.com' && senha === 'connect2026';
  if (valido) localStorage.setItem(AUTH_KEY, JSON.stringify({ email, nome: 'Paulo Aguiar' }));
  return valido;
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function getAuthUser(): { email: string; nome: string } | null {
  const stored = localStorage.getItem(AUTH_KEY);
  return stored ? JSON.parse(stored) : null;
}
