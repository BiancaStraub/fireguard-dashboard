export type ExtType = "CO2" | "PQS" | "Água" | "Espuma";
export type ExtClass = "A" | "B" | "C" | "K";
export type ExtStatus = "Ativo" | "Em Manutenção" | "Descartado";
export type Role = "admin" | "inspetor";

export interface Extintor {
  id: string;
  serie: string;
  tipo: ExtType;
  classe: ExtClass[];
  fabricante: string;
  status: ExtStatus;
  predio: string;
  andar: string;
  setor: string;
  validadeCarga: string; // ISO
  testeHidrostatico: string; // ISO
  alturaCm: number;
}

export interface ChecklistItem {
  key: string;
  label: string;
  conforme: boolean | null;
}

export interface Inspecao {
  id: string;
  extintorId: string;
  extintorSerie: string;
  data: string;
  inspetor: string;
  itens: ChecklistItem[];
  observacoes: string;
  conforme: boolean;
}

export interface User {
  id: string;
  nome: string;
  email: string;
  role: Role;
}