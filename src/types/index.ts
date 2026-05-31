export interface Area {
  id: string;
  nome: string;
  cor: string;
  colider: string;
  icone: string;
}

export interface Evento {
  id: string;
  data: string; // ISO "2026-06-01"
  titulo: string;
  descricao?: string;
}

export interface Escala {
  id: string;
  evento_id: string;
  area_id: string;
  voluntarios: string[];
  observacao?: string;
  criado_por?: string;
  atualizado_em?: string;
}

export interface EscalaComDetalhes extends Escala {
  evento: Evento;
  area: Area;
}
