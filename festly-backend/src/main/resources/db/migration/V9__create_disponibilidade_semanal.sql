CREATE TABLE IF NOT EXISTS agendamentos (
    id          BIGSERIAL    PRIMARY KEY,
    servico_id  BIGINT       NOT NULL,
    cliente_id  BIGINT       NOT NULL,
    data_evento DATE         NOT NULL,
    status      VARCHAR(20)  NOT NULL,
    CONSTRAINT fk_agendamentos_servico FOREIGN KEY (servico_id) REFERENCES servicos(id),
    CONSTRAINT fk_agendamentos_cliente FOREIGN KEY (cliente_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS itens_carrinho (
    id          BIGSERIAL PRIMARY KEY,
    carrinho_id BIGINT    NOT NULL,
    servico_id  BIGINT    NOT NULL,
    data_evento DATE      NOT NULL,
    CONSTRAINT fk_itens_carrinho_carrinho FOREIGN KEY (carrinho_id) REFERENCES carrinhos(id) ON DELETE CASCADE,
    CONSTRAINT fk_itens_carrinho_servico  FOREIGN KEY (servico_id)  REFERENCES servicos(id)
);

ALTER TABLE agendamentos
ADD COLUMN IF NOT EXISTS horario_evento TIME;

CREATE TABLE IF NOT EXISTS disponibilidades_semanais (
    id              BIGSERIAL    PRIMARY KEY,
    servico_id      BIGINT       NOT NULL,
    dia_semana      VARCHAR(12)  NOT NULL,
    hora_inicio     TIME         NOT NULL,
    hora_fim        TIME         NOT NULL,
    duracao_minutos INTEGER      NOT NULL,
    CONSTRAINT fk_disp_semanal_servico FOREIGN KEY (servico_id) REFERENCES servicos(id) ON DELETE CASCADE,
    CONSTRAINT uk_disp_semanal_servico_dia_inicio UNIQUE (servico_id, dia_semana, hora_inicio),
    CONSTRAINT ck_disp_semanal_intervalo CHECK (hora_inicio < hora_fim),
    CONSTRAINT ck_disp_semanal_duracao CHECK (duracao_minutos >= 15)
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_agendamentos_servico_data_hora_ativos
ON agendamentos (servico_id, data_evento, horario_evento)
WHERE status <> 'CANCELADO' AND horario_evento IS NOT NULL;
