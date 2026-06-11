-- V13: Tabela de avaliações
-- Uma avaliação por agendamento (UNIQUE em agendamento_id).
-- Nota inteira 1..5 (CHECK).
-- Comentário opcional, máx 500 caracteres.

CREATE TABLE avaliacoes (
    id BIGSERIAL PRIMARY KEY,
    agendamento_id BIGINT NOT NULL UNIQUE REFERENCES agendamentos(id),
    nota SMALLINT NOT NULL CHECK (nota BETWEEN 1 AND 5),
    comentario VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_avaliacoes_created_at ON avaliacoes (created_at DESC);
