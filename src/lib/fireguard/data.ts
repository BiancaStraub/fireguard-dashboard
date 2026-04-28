import type { Extintor, Inspecao } from "./types";

const TODAY = new Date();
function addDays(d: number) {
  const x = new Date(TODAY);
  x.setDate(x.getDate() + d);
  return x.toISOString();
}
function addYears(y: number) {
  const x = new Date(TODAY);
  x.setFullYear(x.getFullYear() + y);
  return x.toISOString();
}

export const SETORES = [
  "Almoxarifado",
  "Produção Linha A",
  "Produção Linha B",
  "Escritório",
  "Data Center",
  "Cozinha Industrial",
  "Pátio Externo",
  "Recepção",
];

export const seedExtintores: Extintor[] = [
  { id: "e1", serie: "FG-9921", tipo: "CO2", classe: ["B", "C"], fabricante: "Resil", status: "Ativo", predio: "Bloco A", andar: "Térreo", setor: "Data Center", validadeCarga: addDays(420), testeHidrostatico: addYears(3), alturaCm: 150 },
  { id: "e2", serie: "FG-8211", tipo: "PQS", classe: ["A", "B", "C"], fabricante: "Kidde", status: "Ativo", predio: "Bloco B", andar: "1º Andar", setor: "Sala Elétrica", validadeCarga: addDays(-25), testeHidrostatico: addYears(2), alturaCm: 155 },
  { id: "e3", serie: "FG-4430", tipo: "Água", classe: ["A"], fabricante: "Resil", status: "Ativo", predio: "Bloco A", andar: "Térreo", setor: "Recepção", validadeCarga: addDays(11), testeHidrostatico: addYears(4), alturaCm: 140 },
  { id: "e4", serie: "FG-1092", tipo: "CO2", classe: ["B", "C"], fabricante: "Extincenter", status: "Ativo", predio: "Bloco C", andar: "Subsolo", setor: "Cozinha Industrial", validadeCarga: addDays(180), testeHidrostatico: addYears(3), alturaCm: 158 },
  { id: "e5", serie: "FG-2044", tipo: "PQS", classe: ["A", "B", "C"], fabricante: "Kidde", status: "Em Manutenção", predio: "Bloco A", andar: "2º Andar", setor: "Escritório", validadeCarga: addDays(-3), testeHidrostatico: addYears(1), alturaCm: 152 },
  { id: "e6", serie: "FG-1892", tipo: "PQS", classe: ["A", "B", "C"], fabricante: "Resil", status: "Ativo", predio: "Bloco D", andar: "Térreo", setor: "Almoxarifado", validadeCarga: addDays(7), testeHidrostatico: addYears(2), alturaCm: 160 },
  { id: "e7", serie: "FG-2105", tipo: "Água", classe: ["A"], fabricante: "Extincenter", status: "Ativo", predio: "Bloco A", andar: "2º Andar", setor: "Escritório", validadeCarga: addDays(300), testeHidrostatico: addYears(4), alturaCm: 145 },
  { id: "e8", serie: "FG-7723", tipo: "Espuma", classe: ["A", "B"], fabricante: "Kidde", status: "Ativo", predio: "Bloco B", andar: "Térreo", setor: "Pátio Externo", validadeCarga: addDays(45), testeHidrostatico: addYears(3), alturaCm: 148 },
  { id: "e9", serie: "FG-3340", tipo: "CO2", classe: ["B", "C"], fabricante: "Resil", status: "Ativo", predio: "Bloco D", andar: "1º Andar", setor: "Produção Linha A", validadeCarga: addDays(28), testeHidrostatico: addYears(3), alturaCm: 155 },
  { id: "e10", serie: "FG-5566", tipo: "PQS", classe: ["A", "B", "C"], fabricante: "Resil", status: "Ativo", predio: "Bloco D", andar: "1º Andar", setor: "Produção Linha B", validadeCarga: addDays(95), testeHidrostatico: addYears(2), alturaCm: 158 },
  { id: "e11", serie: "FG-6678", tipo: "PQS", classe: ["A", "B", "C"], fabricante: "Kidde", status: "Ativo", predio: "Bloco D", andar: "Térreo", setor: "Almoxarifado", validadeCarga: addDays(220), testeHidrostatico: addYears(4), alturaCm: 159 },
  { id: "e12", serie: "FG-9001", tipo: "CO2", classe: ["B", "C"], fabricante: "Extincenter", status: "Descartado", predio: "Bloco A", andar: "Térreo", setor: "Recepção", validadeCarga: addDays(-180), testeHidrostatico: addYears(-1), alturaCm: 150 },
];

export const CHECKLIST_ITEMS = [
  { key: "lacre", label: "Lacre intacto?" },
  { key: "manometro", label: "Manômetro na faixa verde?" },
  { key: "acesso", label: "Acesso desobstruído?" },
  { key: "sinalizacao", label: "Sinalização correta e visível?" },
  { key: "mangueira", label: "Mangueira/Bico em bom estado?" },
] as const;

export const seedInspecoes: Inspecao[] = [
  {
    id: "i1", extintorId: "e1", extintorSerie: "FG-9921",
    data: addDays(-2), inspetor: "Carlos Mendes",
    itens: CHECKLIST_ITEMS.map((c) => ({ ...c, conforme: true })),
    observacoes: "Sem irregularidades.", conforme: true,
  },
  {
    id: "i2", extintorId: "e3", extintorSerie: "FG-4430",
    data: addDays(-5), inspetor: "Carlos Mendes",
    itens: CHECKLIST_ITEMS.map((c, i) => ({ ...c, conforme: i !== 2 })),
    observacoes: "Caixa de acesso parcialmente bloqueada por equipamento de limpeza.",
    conforme: false,
  },
  {
    id: "i3", extintorId: "e6", extintorSerie: "FG-1892",
    data: addDays(-8), inspetor: "Ana Lima",
    itens: CHECKLIST_ITEMS.map((c) => ({ ...c, conforme: true })),
    observacoes: "OK", conforme: true,
  },
  {
    id: "i4", extintorId: "e9", extintorSerie: "FG-3340",
    data: addDays(-12), inspetor: "Ana Lima",
    itens: CHECKLIST_ITEMS.map((c, i) => ({ ...c, conforme: i !== 3 })),
    observacoes: "Sinalização desbotada — solicitar reposição.",
    conforme: false,
  },
  {
    id: "i5", extintorId: "e4", extintorSerie: "FG-1092",
    data: addDays(-18), inspetor: "Carlos Mendes",
    itens: CHECKLIST_ITEMS.map((c) => ({ ...c, conforme: true })),
    observacoes: "Tudo conforme.", conforme: true,
  },
];