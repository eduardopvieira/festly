CREATE TABLE pagamentos (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT NOT NULL REFERENCES usuarios(id),
    valor_total NUMERIC(10,2) NOT NULL,
    metodo VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL,
    provider VARCHAR(40) NOT NULL,
    provider_charge_id VARCHAR(100) UNIQUE,
    pix_qr_code TEXT,
    pix_qr_code_image TEXT,
    expires_at TIMESTAMP,
    confirmed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_pagamentos_cliente ON pagamentos (cliente_id);
CREATE INDEX idx_pagamentos_provider_charge ON pagamentos (provider_charge_id);
