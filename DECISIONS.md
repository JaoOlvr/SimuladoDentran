# Architecture Decision Records (ADR) — SimulaDetran

Este documento registra as decisões arquiteturais e técnicas fundamentais tomadas durante o desenvolvimento do aplicativo mobile para simulados práticos do Detran (Brasil).

---

## ADR-001: Arquitetura Offline-First com SQLite Nativo e Drizzle ORM

- **Data:** 18/11/2026
- **Status:** Aceito
- **Contexto:** Os instrutores de direção aplicam exames em veículos em movimento por trajetos urbanos onde o sinal 4G/5G oscila frequentemente ou é nulo. A prova não pode ser interrompida nem os dados perdidos.
- **Decisão:** Adotar SQLite nativo local via `expo-sqlite` em conjunto com `drizzle-orm` para tipagem estrita de schemas e consultas. Todas as operações de leitura e gravação durante o simulado ocorrem localmente com transações ACID. Uma fila offline (`sync_queue`) armazena mutações locais para envio posterior ao Supabase.
- **Consequências:** Operação 100% autônoma sem sinal, latência de gravação de infrações < 10ms e consistência de dados garantida.

---

## ADR-002: Motor de Pontuação Puro Desacoplado com Event Sourcing Simplificado

- **Data:** 18/11/2026
- **Status:** Aceito
- **Contexto:** As regras da Resolução Contran nº 1.020/2025 e MBEDV 2026 determinam cálculos de pontuação (1, 2, 4, 6 pontos), limite de 10 pontos para aprovação, regras de incapacidade técnica e encerramentos excepcionais. O instrutor necessita de um botão "Desfazer" instantâneo em caso de toque acidental no volante.
- **Decisão:** O motor em `/src/core/scoring` é implementado em TypeScript puro, sem nenhuma dependência de React, Native APIs ou banco de dados. O estado do simulado é derivado deterministicamente a partir de um log ordenado de eventos (`simulado_eventos`) com flags de reversão (`desfeito`).
- **Consequências:** Testabilidade unitária de 100% com execução ultra-rápida via Jest; capacidade de "Desfazer" qualquer evento em 1 toque recalculando todo o placar de maneira pura e sem efeitos colaterais.

---

## ADR-003: Parametrização por Perfis Estaduais (RegraPerfil)

- **Data:** 18/11/2026
- **Status:** Aceito
- **Contexto:** Embora a Resolução Contran nº 1.020/2025 estabeleça diretrizes federais, os Detrans estaduais publicam portarias específicas (ex.: Portaria Detran-MA nº 127/2026, Portaria Detran-MS nº 214/2026), que podem variar em regras de tempo mínimo, limites e tolerâncias de faltas técnicas.
- **Decisão:** Toda regra de pontuação e limite é carregada a partir de arquivos de configuração declarativos (`perfis_estaduais.json`) e persistida na tabela `perfis_regras`. Maranhão (`MA`) é o perfil padrão do MVP.
- **Consequências:** Zero hardcode de regras estaduais no código; expansão para outros estados requer apenas a adição de um novo registro de perfil.

---

## ADR-004: Ergonomia de Uma Mão e Feedback Háptico para Ambiente Veicular

- **Data:** 18/11/2026
- **Status:** Aceito
- **Contexto:** O instrutor segura a prancheta/celular com uma das mãos enquanto presta atenção no trânsito e na segurança do aluno.
- **Decisão:** Elementos interativos críticos (lançadores de faltas, botão desfazer, finalização) concentrados nos 60% inferiores da tela (Thumb Zone), com alvos de toque mínimos de 56dp. Todo toque aciona vibração háptica (`expo-haptics`) diferenciada por severidade (leve/média vs. grave/gravíssima) e alto contraste visual (WCAG AAA >= 7:1) para legibilidade sob sol forte.
- **Consequências:** Minimização de erros operacionais e dispensabilidade de foco visual prolongado na tela.

---

## ADR-005: Conformidade LGPD por Minimização de Dados

- **Data:** 18/11/2026
- **Status:** Aceito
- **Contexto:** Leis de proteção de dados (LGPD - Lei nº 13.709/2018) exigem minimização no tratamento de dados pessoais em aplicativos educativos e de trânsito.
- **Decisão:** Não coletar CPF, RG nem número de RENACH dos alunos no MVP. O cadastro coleta unicamente Nome, Telefone (para envio do relatório via WhatsApp), Categoria pretendida e Câmbio, exigindo registro explícito de consentimento e fornecendo opção de exclusão definitiva em cascata.
- **Consequências:** Redução drástica da superfície de risco de vazamento de dados sensíveis e conformidade legal transparente.

