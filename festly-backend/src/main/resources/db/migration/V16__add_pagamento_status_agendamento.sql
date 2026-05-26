-- Adição de valores no enum StatusAgendamento (armazenado como VARCHAR via @Enumerated(STRING)):
--   AGUARDANDO_PAGAMENTO  - estado inicial de Agendamento criado via checkout
--   PAGAMENTO_EXPIRADO    - terminal; cobre PIX expirado e pagamento falhado
-- Nenhuma alteração de schema necessária (coluna é VARCHAR).
SELECT 1;
