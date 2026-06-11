package com.projeto.festly.service.payment.dto;

import com.projeto.festly.entity.MetodoPagamento;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record NovaCobrancaRequest(
    String idempotencyKey,
    String clienteNome,
    String clienteEmail,
    String clienteCpf,
    BigDecimal valor,
    MetodoPagamento metodo,
    DadosCartao cartao,
    LocalDateTime expiresAt,
    String descricao
) {}
