CREATE TABLE itens_pagamento (
    id BIGSERIAL PRIMARY KEY,
    pagamento_id BIGINT NOT NULL REFERENCES pagamentos(id),
    agendamento_id BIGINT NOT NULL UNIQUE REFERENCES agendamentos(id),
    valor NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL
);
CREATE INDEX idx_itens_pagamento_pagamento ON itens_pagamento (pagamento_id);
