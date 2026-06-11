# Meus Agendamentos — Design Spec

**Data:** 2026-05-14  
**Status:** Aprovado

---

## Objetivo

Permitir que o cliente visualize seus agendamentos organizados por status e cancele agendamentos ativos com confirmação explícita.

---

## Escopo

Somente frontend. O backend já expõe todos os endpoints necessários:

- `GET /agendamentos/cliente/{clienteId}` — lista todos os agendamentos do cliente em ordem decrescente de início
- `POST /agendamentos/{agendamentoId}/cancelar?clienteId={clienteId}` — cancela um agendamento

O `agendamentoService.js` já tem `listarAgendamentosCliente` e `cancelarAgendamento`.

---

## Arquitetura

### Arquivos alterados/criados

| Arquivo | Tipo | Descrição |
|---|---|---|
| `src/pages/MeusAgendamentos.jsx` | Criado | Página principal com abas e lista de agendamentos |
| `src/routes/index.jsx` | Alterado | Adiciona rota `/meus-agendamentos` sob `DashboardLayout` |
| `src/layouts/DashboardLayout.jsx` | Alterado | Adiciona item "Meus Agendamentos" no `CLIENTE_NAV` |

---

## Componentes e Fluxo de Dados

```
MeusAgendamentos
 ├── useAuth() → user.id
 ├── useState: agendamentos[], loading, cancelingId, confirmOpen
 ├── useEffect: listarAgendamentosCliente(user.id) ao montar
 ├── ativos   = agendamentos com status PENDENTE ou CONFIRMADO
 ├── historico = agendamentos com status CANCELADO ou CONCLUIDO
 ├── Tabs
 │    ├── "Ativos" (badge com count) → lista ativos
 │    └── "Histórico"                → lista histórico
 ├── AgendamentoCard (inline)
 │    ├── Avatar gradiente com inicial do serviço
 │    ├── Nome do serviço, data/hora formatada
 │    ├── Badge de status colorido
 │    └── Botão "Cancelar" (visível apenas para PENDENTE/CONFIRMADO)
 └── AlertDialog de confirmação
      ├── Trigger: clique em "Cancelar"
      └── Confirm: cancelarAgendamento(id, user.id) → toast + reload lista
```

---

## UI / Status Badges

| Status | Cor do badge |
|---|---|
| PENDENTE | Amarelo (`bg-yellow-100 text-yellow-800`) |
| CONFIRMADO | Verde (`bg-green-100 text-green-800`) |
| CANCELADO | Vermelho muted (`bg-red-100 text-red-700`) |
| CONCLUIDO | Azul muted (`bg-blue-100 text-blue-700`) |

Labels em português:
- PENDENTE → "Pendente"
- CONFIRMADO → "Confirmado"
- CANCELADO → "Cancelado"
- CONCLUIDO → "Concluído"

---

## Navegação

- Rota: `/meus-agendamentos`
- Item adicionado ao `CLIENTE_NAV` com ícone `CalendarDays` da `lucide-react`
- Apenas visível para usuários com `tipoUsuario === 'CLIENTE'` (já garantido pela estrutura do `DashboardLayout`)

---

## Tratamento de Erros e Estados

- **Loading:** skeletons animados (2 cards) durante a busca inicial
- **Lista vazia:** mensagem contextual por aba
  - Ativos: "Você não tem agendamentos ativos. Explore o catálogo para agendar serviços."
  - Histórico: "Nenhum agendamento anterior."
- **Erro de cancelamento:** `toast.error` com mensagem da API ou fallback genérico
- **Sucesso no cancelamento:** `toast.success` + reload da lista (`listarAgendamentosCliente`)
- **Estado de loading no cancelamento:** botão "Cancelar" fica desabilitado com spinner enquanto a requisição está em andamento (`cancelingId` armazena qual agendamento está sendo cancelado)

---

## Segurança

O endpoint de cancelamento valida no backend que `clienteId` é dono do agendamento. O frontend passa `user.id` do `AuthContext` (originado do JWT).

---

## Fora de Escopo

- Visualização/cancelamento de agendamentos pelo prestador
- Paginação (lista completa em memória)
- Notificações push ao cancelar
