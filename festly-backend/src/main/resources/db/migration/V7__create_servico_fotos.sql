CREATE TABLE servico_fotos (
    id         BIGSERIAL PRIMARY KEY,
    servico_id BIGINT       NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
    url        VARCHAR(500) NOT NULL,
    ordem      INTEGER      NOT NULL DEFAULT 0
);
