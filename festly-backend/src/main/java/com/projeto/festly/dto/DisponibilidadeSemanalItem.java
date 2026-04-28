package com.projeto.festly.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Data
public class DisponibilidadeSemanalItem {

    @NotNull(message = "O dia da semana é obrigatório")
    private DayOfWeek diaSemana;

    @NotNull(message = "A hora de início é obrigatória")
    private LocalTime horaInicio;

    @NotNull(message = "A hora de fim é obrigatória")
    private LocalTime horaFim;

    @Min(value = 15, message = "A duração mínima de cada bloco é de 15 minutos")
    private int duracaoMinutos = 60;
}
