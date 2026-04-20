CREATE TABLE carrinhos (
    id         BIGSERIAL    PRIMARY KEY,
    usuario_id BIGINT       NOT NULL UNIQUE,
    CONSTRAINT fk_carrinhos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE carrinho_servicos (
    carrinho_id BIGINT NOT NULL,
    servico_id  BIGINT NOT NULL,
    PRIMARY KEY (carrinho_id, servico_id),
    CONSTRAINT fk_cs_carrinho FOREIGN KEY (carrinho_id) REFERENCES carrinhos(id),
    CONSTRAINT fk_cs_servico  FOREIGN KEY (servico_id)  REFERENCES servicos(id)
);
