CREATE TABLE servicos (
    id            BIGSERIAL       PRIMARY KEY,
    nome          VARCHAR(255)    NOT NULL,
    descricao     VARCHAR(1000),
    preco         NUMERIC(10, 2)  NOT NULL,
    categoria     VARCHAR(50)     NOT NULL,
    disponivel    BOOLEAN         NOT NULL DEFAULT TRUE,
    fornecedor_id BIGINT          NOT NULL,
    CONSTRAINT fk_servicos_fornecedor FOREIGN KEY (fornecedor_id) REFERENCES fornecedores (id)
);
