package com.projeto.festly.dto;

import com.projeto.festly.entity.IntervaloHorario;
import com.projeto.festly.entity.RegraDisponibilidade;
import lombok.Builder;
import lombok.Data;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
public class RegraDisponibilidadeResponse {

    private Long id;
    private Long servicoId;
    private DayOfWeek diaInicio;
    private DayOfWeek diaFim;
    private int duracaoPadraoMinutos;
    private boolean ativa;
    private List<Item> intervalos;

    @Data
    @Builder
    public static class Item {
        private Long id;
        private LocalTime horaInicio;
        private LocalTime horaFim;
        private boolean atravessaMeiaNoite;
    }

    public static RegraDisponibilidadeResponse from(RegraDisponibilidade regra) {
        return RegraDisponibilidadeResponse.builder()
                .id(regra.getId())
                .servicoId(regra.getServico().getId())
                .diaInicio(regra.getDiaInicio())
                .diaFim(regra.getDiaFim())
                .duracaoPadraoMinutos(regra.getDuracaoPadraoMinutos())
                .ativa(regra.isAtiva())
                .intervalos(regra.getIntervalos().stream().map(RegraDisponibilidadeResponse::fromIntervalo).toList())
                .build();
    }

    private static Item fromIntervalo(IntervaloHorario intervalo) {
        return Item.builder()
                .id(intervalo.getId())
                .horaInicio(intervalo.getHoraInicio())
                .horaFim(intervalo.getHoraFim())
                .atravessaMeiaNoite(intervalo.atravessaMeiaNoite())
                .build();
    }
}
