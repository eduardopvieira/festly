-- =====================================================================
-- V11: Refatora o módulo de agendamento para intervalos contínuos
-- =====================================================================
-- Mudanças principais:
--   * regras_disponibilidade  (substitui disponibilidades_semanais):
--       - dia_inicio + dia_fim (intervalos contínuos de dias)
--       - duracao_padrao_minutos (granularidade default)
--   * intervalos_horario       (novo, 1:N por regra):
--       - hora_inicio / hora_fim (suporta pernoite quando hora_fim <= hora_inicio)
--   * agendamentos / itens_carrinho:
--       - colunas inicio/fim (TIMESTAMP) substituem data_evento + horario_evento
--   * Constraint anti-overlap em agendamentos via EXCLUDE USING gist + tstzrange
-- =====================================================================

-- Necessário para EXCLUDE USING gist combinando colunas escalares e ranges
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Limpa estruturas antigas (sem dados em produção; ambiente de dev)
DROP INDEX IF EXISTS uk_agendamentos_servico_data_hora_ativos;
DROP INDEX IF EXISTS uk_itens_carrinho_carrinho_servico_data_hora;
DROP TABLE IF EXISTS disponibilidades_semanais;

-- ---------------------------------------------------------------------
-- regras_disponibilidade
-- ---------------------------------------------------------------------
CREATE TABLE regras_disponibilidade (
    id                       BIGSERIAL    PRIMARY KEY,
    servico_id               BIGINT       NOT NULL,
    dia_inicio               VARCHAR(12)  NOT NULL,
    dia_fim                  VARCHAR(12)  NOT NULL,
    duracao_padrao_minutos   INTEGER      NOT NULL,
    ativa                    BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_regra_disp_servico
        FOREIGN KEY (servico_id) REFERENCES servicos(id) ON DELETE CASCADE,
    CONSTRAINT ck_regra_disp_duracao
        CHECK (duracao_padrao_minutos >= 15)
);

CREATE INDEX idx_regra_disp_servico ON regras_disponibilidade (servico_id);

-- ---------------------------------------------------------------------
-- intervalos_horario
-- ---------------------------------------------------------------------
CREATE TABLE intervalos_horario (
    id           BIGSERIAL  PRIMARY KEY,
    regra_id     BIGINT     NOT NULL,
    hora_inicio  TIME       NOT NULL,
    hora_fim     TIME       NOT NULL,
    CONSTRAINT fk_intervalo_regra
        FOREIGN KEY (regra_id) REFERENCES regras_disponibilidade(id) ON DELETE CASCADE,
    -- inicio == fim seria intervalo zerado; permitimos inicio > fim (pernoite)
    CONSTRAINT ck_intervalo_distinto CHECK (hora_inicio <> hora_fim)
);

CREATE INDEX idx_intervalo_regra ON intervalos_horario (regra_id);

-- ---------------------------------------------------------------------
-- agendamentos: substitui data_evento/horario_evento por inicio/fim
-- ---------------------------------------------------------------------
ALTER TABLE agendamentos DROP COLUMN IF EXISTS data_evento;
ALTER TABLE agendamentos DROP COLUMN IF EXISTS horario_evento;

ALTER TABLE agendamentos ADD COLUMN inicio TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE agendamentos ADD COLUMN fim    TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE agendamentos ALTER COLUMN inicio DROP DEFAULT;
ALTER TABLE agendamentos ALTER COLUMN fim    DROP DEFAULT;
ALTER TABLE agendamentos ADD CONSTRAINT ck_agendamento_intervalo CHECK (inicio < fim);

CREATE INDEX idx_agendamento_servico_inicio ON agendamentos (servico_id, inicio);

-- Anti-overlap atômico no banco: bloqueia dois agendamentos ATIVOS do mesmo
-- serviço cujas faixas se cruzam. Usa tsrange com lower-inclusive/upper-exclusive
-- e o operador && (overlap), sob EXCLUDE USING gist.
ALTER TABLE agendamentos ADD CONSTRAINT no_overlap_agendamento
    EXCLUDE USING gist (
        servico_id WITH =,
        tsrange(inicio, fim, '[)') WITH &&
    )
    WHERE (status <> 'CANCELADO');

-- ---------------------------------------------------------------------
-- itens_carrinho: substitui data_evento/horario_evento por inicio/fim
-- ---------------------------------------------------------------------
ALTER TABLE itens_carrinho DROP COLUMN IF EXISTS data_evento;
ALTER TABLE itens_carrinho DROP COLUMN IF EXISTS horario_evento;

ALTER TABLE itens_carrinho ADD COLUMN inicio TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE itens_carrinho ADD COLUMN fim    TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE itens_carrinho ALTER COLUMN inicio DROP DEFAULT;
ALTER TABLE itens_carrinho ALTER COLUMN fim    DROP DEFAULT;
ALTER TABLE itens_carrinho ADD CONSTRAINT ck_item_carrinho_intervalo CHECK (inicio < fim);

CREATE INDEX idx_item_carrinho_servico_inicio ON itens_carrinho (servico_id, inicio);
CREATE UNIQUE INDEX uk_item_carrinho_carrinho_servico_inicio
    ON itens_carrinho (carrinho_id, servico_id, inicio);
