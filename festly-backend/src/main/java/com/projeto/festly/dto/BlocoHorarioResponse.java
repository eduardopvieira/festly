package com.projeto.festly.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@AllArgsConstructor
public class BlocoHorarioResponse {
    private LocalDate data;
    private LocalTime hora;
    private int duracaoMinutos;
    private BlocoStatus status;
}
