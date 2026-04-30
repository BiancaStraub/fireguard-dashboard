Fireguard | Sistema de Monitoramento de Rede de Proteção
Este projeto apresenta o front-end de um sistema web para gestão e monitoramento de equipamentos de segurança contra incêndio, batizado de Fireguard. O objetivo é fornecer uma interface centralizada e eficiente para administradores e inspetores controlarem a conformidade e a validade da rede de proteção.

O desenvolvimento foca na usabilidade e na visualização clara de métricas críticas, permitindo uma ação rápida e baseada em dados reais.

Arquitetura do Sistema e Funcionalidades
A plataforma está organizada em módulos distintos, cada um focado em uma etapa da gestão de segurança. O fluxo de trabalho e as visualizações principais podem ser vistos abaixo:

Painel Principal (Dashboard)
Centraliza as informações mais importantes da rede de proteção em tempo real. O dashboard fornece uma visão panorâmica da saúde dos ativos, permitindo ao administrador identificar gargalos instantaneamente.

Indicadores de Estado: Exibe o total de ativos patrimoniais cadastrados e o status atual dos equipamentos:

Ativos Vencidos: Alerta com destaque vermelho para ações imediatas.

Ativos Vencendo: Alerta em laranja para ativos com validade próxima (próximos 30 dias).

Inspeções Concluídas: Total de verificações realizadas no mês corrente.

Distribuição por Setor: Gráfico de setores (pizza) para visualizar a cobertura de proteção e o nível de conformidade por área.

Próximos do Vencimento: Lista ordenada para auxiliar na priorização e no planejamento de manutenção.

Inventário de Extintores
Gerenciamento completo do ciclo de vida de cada equipamento. O inventário é a base de dados central do sistema, onde cada ativo é catalogado com suas especificações técnicas e de localização.

Filtros e Pesquisa: Ferramentas robustas para buscar ativos por código, fabricante, setor, tipo/classe e status.

Lista Detalhada: Exibição estruturada com informações cruciais como:

Código do Ativo.

Tipo / Classe de Incêndio (ex: PQS, CO2, Água).

Localização exata.

Validade (revisão e carga).

Status de Conformidade.

Módulo de Inspeção em Campo
Funcionalidade projetada para otimizar o fluxo de trabalho do inspetor diretamente no local do equipamento. Este módulo agiliza a coleta de dados e reduz erros de preenchimento.

Identificação por QR Code: Utiliza a câmera do dispositivo para escanear o código do extintor, abrindo automaticamente o checklist correspondente.

Iniciação do Checklist: Ponto de partida para o registro de observações e resultados da inspeção.

Relatórios e Histórico
Gerenciamento e centralização do registro de todas as inspeções realizadas, essencial para auditorias e conformidade legal.

Métricas de Conformidade: Total de inspeções realizadas, discriminando quantas foram consideradas conformes e não conformes.

Linha do Tempo de Inspeções: Histórico cronológico detalhado de todas as verificações, facilitando a rastreabilidade.

Exportação de Dados: Botão para exportação de relatório mensal, útil para compilar informações para gerência ou autoridades.

Este projeto demonstra competências em design de interface para sistemas de gestão (admin panels), arquitetura de software baseada em módulos e o uso prático de dashboards para visualização de dados operacionais complexos.
