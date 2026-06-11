ALTER TABLE itens_carrinho
ADD COLUMN IF NOT EXISTS horario_evento TIME;

CREATE UNIQUE INDEX IF NOT EXISTS uk_itens_carrinho_carrinho_servico_data_hora
ON itens_carrinho (carrinho_id, servico_id, data_evento, horario_evento)
WHERE horario_evento IS NOT NULL;
