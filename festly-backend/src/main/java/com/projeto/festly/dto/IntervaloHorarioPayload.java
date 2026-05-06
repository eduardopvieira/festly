package com.projeto.festly.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalTime;

@Data
public class IntervaloHorarioPayload {

    @NotNull(message = "A hora de início é obrigatória")
    private LocalTime horaInicio;

    @NotNull(message = "A hora de fim é obrigatória")
    private LocalTime horaFim;
}
