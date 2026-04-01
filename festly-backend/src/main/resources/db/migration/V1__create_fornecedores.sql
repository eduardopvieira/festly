CREATE TABLE fornecedores (
    id         BIGSERIAL    PRIMARY KEY,
    nome       VARCHAR(255) NOT NULL,
    email      VARCHAR(255),
    telefone   VARCHAR(20),
    cnpj       VARCHAR(18)  UNIQUE,
    descricao  VARCHAR(1000)
);
