package com.projeto.festly.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.DayOfWeek;
import java.util.List;

@Data
public class RegraDisponibilidadePayload {

    @NotNull(message = "O dia inicial é obrigatório")
    private DayOfWeek diaInicio;

    @NotNull(message = "O dia final é obrigatório")
    private DayOfWeek diaFim;

    @Min(value = 15, message = "A duração padrão dos blocos deve ser >= 15 minutos")
    private int duracaoPadraoMinutos = 30;

    private boolean ativa = true;

    @NotEmpty(message = "Inclua pelo menos um intervalo de horário")
    @Valid
    private List<IntervaloHorarioPayload> intervalos;
}
