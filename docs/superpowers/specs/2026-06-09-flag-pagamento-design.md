# Flag de pagamento no painel do prestador — Design

**Data:** 2026-06-09
**Sem testes automatizados** (decisão do usuário).

## Objetivo

Exibir uma flag visual **"Pago"** (ícone `BadgeCheck` + texto, verde) nos cards de agendamento — tanto na visão do **prestador** (`Solicitacoes.jsx`) quanto na do **cliente** (`MeusAgendamentos.jsx`) — indicando que o serviço já foi pago e ainda falta ser realizado. O badge fica **ao lado do badge de status** (Pendente/Confirmado).

## Contexto do modelo

- `Agendamento.status` (enum): `AGUARDANDO_PAGAMENTO`, `PENDENTE`, `CONFIRMADO`, `REJEITADO`, `CANCELADO`, `CONCLUIDO`, `PAGAMENTO_EXPIRADO`.
- Pagamento confirmado move `AGUARDANDO_PAGAMENTO` → `PENDENTE` (`PagamentoService`).
- Mas há caminho que cria `PENDENTE` direto sem pagamento (`AgendamentoService.criar`, linha ~75), e `ItemPagamento` pode ficar `ESTORNADO`. Logo, status **não** é sinal confiável de "pago".
- Sinal confiável: existir `ItemPagamento` com status `ATIVO` ligado ao agendamento (`ItemPagamento.agendamento_id` é único).
- Abas do prestador: **Pendentes** = `PENDENTE`; **Histórico** = todo o resto (inclui `CONFIRMADO`, `CONCLUIDO`, etc.).

## Decisões

- **Onde:** flag em agendamentos **PENDENTE e CONFIRMADO** (pago e ainda não realizado). PENDENTE aparece na aba Pendentes; CONFIRMADO na aba Histórico.
- **Fonte do "pago":** computado no backend a partir de `ItemPagamento` ATIVO (trata estorno e criação sem pagamento).
- **Visual:** badge verde com ícone `BadgeCheck` + texto "Pago", posicionado ao lado do badge de status.
- **Telas:** prestador (`Solicitacoes.jsx`) e cliente (`MeusAgendamentos.jsx`). Ambas as listagens usam `toResponseComAvaliacaoFlag`, então o `pago` já vem nas duas.

## 1. Backend — expor `pago` no AgendamentoResponse

- **`AgendamentoResponse`**: novo campo `private boolean pago;`. Nova sobrecarga `from(Agendamento agendamento, boolean jaAvaliado, boolean pago)` que seta o campo. As assinaturas existentes — `from(agendamento)` e `from(agendamento, jaAvaliado)` — passam a delegar com `pago = false`, preservando os demais chamadores.
- **`ItemPagamentoRepository`**: novo método `boolean existsByAgendamentoIdAndStatus(Long agendamentoId, StatusItemPagamento status)`.
- **`AgendamentoService`**: injetar `ItemPagamentoRepository` (se ainda não estiver). O `toResponseComAvaliacaoFlag(ag)`, usado por `listarDoPrestador`, passa a calcular:
  ```java
  boolean pago = itemPagamentoRepository
      .existsByAgendamentoIdAndStatus(ag.getId(), StatusItemPagamento.ATIVO);
  return AgendamentoResponse.from(ag, jaAvaliado, pago);
  ```
  Mesmo padrão por-item do `jaAvaliado` (página de 10 itens, sem N+1 relevante).

## 2. Frontend — badge no card

Condição de exibição (ambas as telas):
```js
ag.pago && (ag.status === 'PENDENTE' || ag.status === 'CONFIRMADO')
```
Badge: `<BadgeCheck/>` + "Pago", pílula `bg-emerald-100 text-emerald-700`, agrupado num flex ao lado do badge de status.

- **`Solicitacoes.jsx`** (prestador) — badge no topo, ao lado do badge de status. O status passa a ser **sempre exibido**, inclusive "Pendente" (antes era ocultado para PENDENTE), para o "Pago" ficar lado a lado com ele.
- **`MeusAgendamentos.jsx`** (cliente) — badge na linha de status do `AgendamentoCard`, antes do badge de status.

## 3. Casos de borda

- `pago` false/ausente → sem badge (comportamento atual intacto).
- `ESTORNADO` → `existsByAgendamentoIdAndStatus(id, ATIVO)` false → sem badge, mesmo CONFIRMADO.
- `CONCLUIDO` pago → sem badge (já realizado; condição exclui CONCLUIDO).
- Criado sem pagamento (PENDENTE direto) → sem `ItemPagamento` ATIVO → sem badge.
- Outros consumidores de `AgendamentoResponse` (ex.: `MeusAgendamentos` do cliente) recebem `pago = false` pelas assinaturas antigas — nada muda.

## Fora de escopo

- Testes automatizados.
- Mudar de aba os CONFIRMADO (continuam no Histórico; só ganham o badge).
- Qualquer alteração no fluxo de pagamento em si.
