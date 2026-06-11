-- V12: Adiciona numeroPessoas ao agendamento/carrinho e status REJEITADO

ALTER TABLE agendamentos     ADD COLUMN numero_pessoas INTEGER;
ALTER TABLE itens_carrinho   ADD COLUMN numero_pessoas INTEGER;

-- Recria a constraint anti-overlap para também liberar slots REJEITADO
ALTER TABLE agendamentos DROP CONSTRAINT IF EXISTS no_overlap_agendamento;
ALTER TABLE agendamentos ADD CONSTRAINT no_overlap_agendamento
    EXCLUDE USING gist (
        servico_id WITH =,
        tsrange(inicio, fim, '[)') WITH &&
    )
    WHERE (status NOT IN ('CANCELADO', 'REJEITADO'));
