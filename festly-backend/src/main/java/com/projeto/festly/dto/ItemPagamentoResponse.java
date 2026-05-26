package com.projeto.festly.dto;

import com.projeto.festly.entity.*;

import java.math.BigDecimal;

public record ItemPagamentoResponse(
    Long agendamentoId,
    BigDecimal valor,
    StatusItemPagamento status,
    StatusAgendamento statusAgendamento
) {
    public static ItemPagamentoResponse from(ItemPagamento item) {
        return new ItemPagamentoResponse(
            item.getAgendamento().getId(),
            item.getValor(),
            item.getStatus(),
            item.getAgendamento().getStatus()
        );
    }
}
