CREATE TABLE usuarios (
    id                  BIGSERIAL    PRIMARY KEY,
    nome                VARCHAR(255) NOT NULL,
    email               VARCHAR(255) NOT NULL UNIQUE,
    senha               VARCHAR(255) NOT NULL,
    cpf                 VARCHAR(14)  UNIQUE,
    cnpj                VARCHAR(18)  UNIQUE,
    tipo                VARCHAR(20)  NOT NULL,
    verificado          BOOLEAN      NOT NULL DEFAULT FALSE,
    codigo_verificacao  VARCHAR(6),
    codigo_expiracao    TIMESTAMP
);
