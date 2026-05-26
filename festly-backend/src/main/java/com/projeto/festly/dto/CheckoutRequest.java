package com.projeto.festly.dto;

import com.projeto.festly.entity.MetodoPagamento;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record CheckoutRequest(
    @NotNull MetodoPagamento metodo,
    @Valid DadosCartaoRequest cartao
) {}
