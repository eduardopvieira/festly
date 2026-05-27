-- V17: alinha a constraint anti-overlap com a lógica de StatusAgendamento.
--
-- PAGAMENTO_EXPIRADO é um estado terminal que LIBERA o slot (igual a CANCELADO
-- e REJEITADO). A constraint original (V12) só excluía CANCELADO e REJEITADO,
-- então um agendamento PAGAMENTO_EXPIRADO ainda bloqueava o horário no banco —
-- mesmo o código (AgendamentoRepository.existsActiveConflict) tratando-o como
-- inativo. Isso fazia o checkout falhar com violação da exclusion constraint
-- ("Conflito de horário durante checkout") ao reutilizar um slot expirado.
--
-- Recriar a constraint com PAGAMENTO_EXPIRADO no NOT IN também remove do índice
-- GiST os agendamentos já expirados, liberando os slots presos.
ALTER TABLE agendamentos DROP CONSTRAINT IF EXISTS no_overlap_agendamento;
ALTER TABLE agendamentos ADD CONSTRAINT no_overlap_agendamento
    EXCLUDE USING gist (
        servico_id WITH =,
        tsrange(inicio, fim, '[)') WITH &&
    )
    WHERE (status NOT IN ('CANCELADO', 'REJEITADO', 'PAGAMENTO_EXPIRADO'));
