package com.projeto.festly.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AvaliacaoRequest {

    @NotNull(message = "agendamentoId é obrigatório")
    private Long agendamentoId;

    @NotNull(message = "nota é obrigatória")
    @Min(value = 1, message = "nota mínima é 1")
    @Max(value = 5, message = "nota máxima é 5")
    private Integer nota;

    @Size(max = 500, message = "comentário deve ter no máximo 500 caracteres")
    private String comentario;
}
