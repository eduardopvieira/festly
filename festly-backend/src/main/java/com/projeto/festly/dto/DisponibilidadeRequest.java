package com.projeto.festly.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class DisponibilidadeRequest {

    @NotNull(message = "A lista de regras é obrigatória")
    @Valid
    private List<RegraDisponibilidadePayload> regras;
}
