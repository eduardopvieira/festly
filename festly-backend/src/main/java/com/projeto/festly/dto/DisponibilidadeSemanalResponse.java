package com.projeto.festly.dto;

import com.projeto.festly.entity.DisponibilidadeSemanal;
import lombok.Builder;
import lombok.Data;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Data
@Builder
public class DisponibilidadeSemanalResponse {

    private Long id;
    private Long servicoId;
    private DayOfWeek diaSemana;
    private LocalTime horaInicio;
    private LocalTime horaFim;
    private int duracaoMinutos;

    public static DisponibilidadeSemanalResponse from(DisponibilidadeSemanal disp) {
        return DisponibilidadeSemanalResponse.builder()
                .id(disp.getId())
                .servicoId(disp.getServico().getId())
                .diaSemana(disp.getDiaSemana())
                .horaInicio(disp.getHoraInicio())
                .horaFim(disp.getHoraFim())
                .duracaoMinutos(disp.getDuracaoMinutos())
                .build();
    }
}
