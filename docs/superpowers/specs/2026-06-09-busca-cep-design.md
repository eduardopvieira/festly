# Busca por CEP — Design

**Data:** 2026-06-09
**Abordagem:** A — Frontend direto no ViaCEP + unidades compartilhadas. Sem testes nesta feature (decisão do usuário).

## Objetivo

Autopreencher endereço a partir do CEP em três telas:

1. **Modal de agendamento** (`SolicitarAgendamentoModal`) — form de novo endereço do evento.
2. **Cadastro/edição de serviço** (`ServicoForm`, usado por `ServicoWizard` e `EditarServico`) — passa a armazenar `cep` + `estado` no serviço.
3. **Checkout** (`Checkout`) — CEP de cobrança do cartão (validação apenas).

A busca usa o ViaCEP (`https://viacep.com.br/ws/{cep}/json/`) — público, gratuito, sem chave, com CORS liberado. Chamado direto do browser.

## 1. Unidades compartilhadas (frontend)

### `src/services/cepService.js` — `buscarCep(cep)`
- Sanitiza para 8 dígitos; se não tiver 8 → lança `CepInvalidoError`.
- `GET https://viacep.com.br/ws/{cep}/json/`.
- ViaCEP retorna `{ erro: true }` para CEP inexistente → lança `CepNaoEncontradoError`.
- Sucesso → normaliza para `{ cep, rua, bairro, cidade, estado }`, mapeando `logradouro→rua`, `localidade→cidade`, `uf→estado`.
- Deixar um gancho comentado para fallback futuro (BrasilAPI), sem adicionar dependência agora.

### `src/lib/formatCep.js` — `formatCep(valor)`
- Aplica máscara `00000-000`, cortando em 8 dígitos. Usado no `onChange` dos campos CEP.

### `src/hooks/useBuscaCep.js`
- Retorna `{ buscar, loading, erro }`.
- `buscar(cep, onSuccess)` chama o `cepService`, gerencia `loading` e mensagem de `erro`, e invoca `onSuccess(endereco)` para o form preencher seus próprios campos.
- Desacopla os 3 forms (dois com `useState`, um com `react-hook-form`) da fonte de dados.
- Ignora respostas obsoletas (flag de versão/abort) para evitar race condition quando o usuário digita rápido.

### Comportamento de gatilho
- Dispara quando o CEP atinge 8 dígitos (no `onChange`) **e** no `onBlur`.
- Campos autopreenchidos permanecem **editáveis** (ViaCEP às vezes omite logradouro/bairro).

## 2. Integração nos formulários

### `SolicitarAgendamentoModal.jsx`
- O campo CEP existente (~linha 419) ganha máscara, spinner de loading e, no sucesso, preenche `rua`, `bairro`, `cidade`, `estado` via `setState`.
- Foco move para o campo "Número" após preencher.
- Erro exibido inline abaixo do campo.

### `ServicoForm.jsx` (react-hook-form)
- Novo campo **CEP** acima de "Cidade".
- No sucesso: `setValue('cidade', …)` e `setValue('estado', …)`.
- Adicionar `estado` (e `cep`) ao schema Zod e ao form. "Cidade" continua editável.
- `ServicoWizard` (criar) e `EditarServico` (editar) passam a enviar/receber `cep` e `estado`.

### `Checkout.jsx` (react-hook-form)
- Campo CEP de cobrança ganha máscara + validação via `useBuscaCep` (apenas valida existência do CEP e mostra erro se inválido — não há campos de rua/bairro visíveis para preencher).
- Campo "número" segue manual.

## 3. Backend — persistir CEP + UF no serviço

- **Entidade `Servico`**: adicionar `cep` (`@Column(length = 9)`) e `estado` (`@Column(length = 2)`), **nullable** — serviços existentes não têm esses dados; ficam preenchidos a partir da próxima criação/edição.
- **Migration `V18__add_cep_estado_servicos.sql`**:
  ```sql
  ALTER TABLE servicos ADD COLUMN cep VARCHAR(9), ADD COLUMN estado VARCHAR(2);
  ```
- **`ServicoRequest`**: adicionar `cep` e `estado`, **opcionais** no DTO (validação leve de formato só se vierem preenchidos: `@Pattern` de CEP, UF com 2 letras). Obrigatoriedade fica na validação Zod do formulário.
- **`ServicoResponse`**: adicionar `cep` e `estado` + os `set` no `from(...)`.
- **`ServicoService`**: preencher os dois campos no `builder()` da criação (`ServicoService.java:36`) e nos setters da edição (`ServicoService.java:104`).

## 4. Tratamento de erros

- **CEP < 8 dígitos:** não dispara busca; valida só no submit do form.
- **CEP inexistente (`{erro:true}`):** mensagem inline "CEP não encontrado"; campos não alterados; preenchimento manual permitido.
- **Falha de rede / ViaCEP fora:** mensagem "Não foi possível buscar o CEP. Preencha manualmente."; campos permanecem editáveis. A busca nunca bloqueia o preenchimento manual.
- **Race condition:** resposta da última busca prevalece (flag de versão/abort no hook).
- **Backend:** `cep`/`estado` ausentes são aceitos (nullable); validação de formato só roda se preenchidos.

## Fora de escopo

- Testes automatizados (decisão do usuário).
- Fallback multi-provedor (apenas gancho comentado para futuro).
- Armazenar endereço completo do serviço (apenas `cep` + `estado` além da `cidade` já existente).
