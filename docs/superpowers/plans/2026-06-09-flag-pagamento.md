# Flag de pagamento no painel do prestador — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exibir um badge verde "Pago" nos cards de agendamento PENDENTE/CONFIRMADO do prestador, indicando que o serviço foi pago e ainda falta ser realizado.

**Architecture:** Backend computa um booleano `pago` no `AgendamentoResponse` a partir da existência de um `ItemPagamento` ATIVO ligado ao agendamento; o frontend (`Solicitacoes.jsx`) renderiza o badge quando `pago` e status ∈ {PENDENTE, CONFIRMADO}.

**Tech Stack:** Spring Boot (Java 17) + Spring Data JPA no backend; React 19 + Vite no frontend.

**Nota:** Sem testes automatizados (decisão do usuário). Verificação = compilar/lintar/rodar e checagem manual. Commits a cada tarefa.

---

## Estrutura de arquivos

**Modificar:**
- `festly-backend/src/main/java/com/projeto/festly/repository/ItemPagamentoRepository.java` — novo método de existência por status.
- `festly-backend/src/main/java/com/projeto/festly/dto/AgendamentoResponse.java` — campo `pago` + sobrecarga de `from`.
- `festly-backend/src/main/java/com/projeto/festly/service/AgendamentoService.java` — calcular `pago` na listagem do prestador.
- `festly-frontend/src/pages/Solicitacoes.jsx` — badge "Pago".

`itemPagamentoRepository` já está injetado em `AgendamentoService` (linha 44) — nenhuma injeção nova é necessária.

---

## Task 1: Backend — método no ItemPagamentoRepository

**Files:**
- Modify: `festly-backend/src/main/java/com/projeto/festly/repository/ItemPagamentoRepository.java`

- [ ] **Step 1: Adicionar import e método de existência**

Substituir o conteúdo do arquivo por:

```java
package com.projeto.festly.repository;

import com.projeto.festly.entity.ItemPagamento;
import com.projeto.festly.entity.StatusItemPagamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ItemPagamentoRepository extends JpaRepository<ItemPagamento, Long> {
    Optional<ItemPagamento> findByAgendamentoId(Long agendamentoId);

    boolean existsByAgendamentoIdAndStatus(Long agendamentoId, StatusItemPagamento status);
}
```

- [ ] **Step 2: Commit**

```bash
git add festly-backend/src/main/java/com/projeto/festly/repository/ItemPagamentoRepository.java
git commit -m "feat: existsByAgendamentoIdAndStatus no ItemPagamentoRepository"
```

---

## Task 2: Backend — campo `pago` no AgendamentoResponse

**Files:**
- Modify: `festly-backend/src/main/java/com/projeto/festly/dto/AgendamentoResponse.java`

- [ ] **Step 1: Adicionar o campo**

Após `private boolean jaAvaliado;` (linha ~33):

```java
    private boolean jaAvaliado;
    private boolean pago;
```

- [ ] **Step 2: Encadear as sobrecargas de `from`**

Substituir os dois métodos `from` existentes por três sobrecargas encadeadas (preserva os chamadores atuais com `pago = false`):

```java
    public static AgendamentoResponse from(Agendamento agendamento) {
        return from(agendamento, false, false);
    }

    public static AgendamentoResponse from(Agendamento agendamento, boolean jaAvaliado) {
        return from(agendamento, jaAvaliado, false);
    }

    public static AgendamentoResponse from(Agendamento agendamento, boolean jaAvaliado, boolean pago) {
        AgendamentoResponse response = new AgendamentoResponse();
        response.setId(agendamento.getId());
        response.setServicoId(agendamento.getServico().getId());
        response.setNomeServico(agendamento.getServico().getNome());
        response.setClienteId(agendamento.getCliente().getId());
        response.setNomeCliente(agendamento.getCliente().getNome());
        response.setEmailCliente(agendamento.getCliente().getEmail());
        response.setNomePrestador(agendamento.getServico().getUsuario().getNome());
        response.setInicio(agendamento.getInicio());
        response.setFim(agendamento.getFim());
        response.setStatus(agendamento.getStatus());
        response.setNumeroPessoas(agendamento.getNumeroPessoas());
        response.setRua(agendamento.getRua());
        response.setNumero(agendamento.getNumero());
        response.setBairro(agendamento.getBairro());
        response.setCidade(agendamento.getCidade());
        response.setEstado(agendamento.getEstado());
        response.setCep(agendamento.getCep());
        response.setComplemento(agendamento.getComplemento());
        response.setTipoEvento(agendamento.getTipoEvento());
        response.setObservacoes(agendamento.getObservacoes());
        response.setCreatedAt(agendamento.getCreatedAt());
        response.setJaAvaliado(jaAvaliado);
        response.setPago(pago);
        return response;
    }
```

- [ ] **Step 3: Commit**

```bash
git add festly-backend/src/main/java/com/projeto/festly/dto/AgendamentoResponse.java
git commit -m "feat: campo pago no AgendamentoResponse"
```

---

## Task 3: Backend — calcular `pago` na listagem do prestador

**Files:**
- Modify: `festly-backend/src/main/java/com/projeto/festly/service/AgendamentoService.java`

- [ ] **Step 1: Adicionar import de StatusItemPagamento**

Junto aos outros imports de entidade no topo (perto de `import com.projeto.festly.entity.StatusAgendamento;`):

```java
import com.projeto.festly.entity.StatusItemPagamento;
```

- [ ] **Step 2: Calcular `pago` em toResponseComAvaliacaoFlag**

Substituir o método (linha ~169):

```java
    private AgendamentoResponse toResponseComAvaliacaoFlag(Agendamento ag) {
        boolean jaAvaliado = ag.getStatus() == StatusAgendamento.CONCLUIDO
                && avaliacaoRepository.existsByAgendamentoId(ag.getId());
        boolean pago = itemPagamentoRepository
                .existsByAgendamentoIdAndStatus(ag.getId(), StatusItemPagamento.ATIVO);
        return AgendamentoResponse.from(ag, jaAvaliado, pago);
    }
```

- [ ] **Step 3: Compilar o backend**

Run: `cd festly-backend; ./mvnw -q compile`
Expected: BUILD SUCCESS.

- [ ] **Step 4: Commit**

```bash
git add festly-backend/src/main/java/com/projeto/festly/service/AgendamentoService.java
git commit -m "feat: calcula flag pago na listagem do prestador"
```

---

## Task 4: Frontend — badge "Pago" no card

**Files:**
- Modify: `festly-frontend/src/pages/Solicitacoes.jsx`

- [ ] **Step 1: Renderizar o badge ao lado do nome do serviço**

Localizar a linha do nome do serviço dentro de `SolicitacaoCard` (linha ~106):

```jsx
        <p className="font-medium text-foreground text-sm">{ag.nomeServico}</p>
```

Substituir por (badge verde quando pago e ainda não realizado):

```jsx
        <p className="font-medium text-foreground text-sm flex items-center gap-2">
          {ag.nomeServico}
          {ag.pago && (ag.status === 'PENDENTE' || ag.status === 'CONFIRMADO') && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              Pago
            </span>
          )}
        </p>
```

- [ ] **Step 2: Lint do frontend**

Run: `cd festly-frontend; npm run lint`
Expected: sem novos erros em `Solicitacoes.jsx` (erros pré-existentes em outros arquivos podem persistir).

- [ ] **Step 3: Verificação manual**

Como `prestador1@gmail.com`, abrir *Solicitações*. Um agendamento pago (PENDENTE) deve mostrar o badge verde "Pago" ao lado do nome do serviço. Conferir também na aba Histórico um CONFIRMADO pago. Um agendamento sem pagamento/estornado não mostra o badge.

- [ ] **Step 4: Commit**

```bash
git add festly-frontend/src/pages/Solicitacoes.jsx
git commit -m "feat: badge Pago no painel de solicitacoes do prestador"
```

---

## Self-review checklist (já verificado)

- **Cobertura do spec:** backend `pago` (Tasks 1-3), badge frontend PENDENTE+CONFIRMADO (Task 4), casos de borda cobertos pela condição `pago && status∈{PENDENTE,CONFIRMADO}` + fonte ATIVO (exclui estorno/sem-pagamento/concluído). ✓
- **Sem placeholders:** todo passo traz código real. ✓
- **Consistência de tipos:** `existsByAgendamentoIdAndStatus(Long, StatusItemPagamento)` definido na Task 1 e usado na Task 3; `from(ag, jaAvaliado, pago)` definido na Task 2 e usado na Task 3; campo `pago` (Task 2) lido como `ag.pago` na Task 4. ✓
- **Sem testes:** conforme decisão do usuário. ✓
```
