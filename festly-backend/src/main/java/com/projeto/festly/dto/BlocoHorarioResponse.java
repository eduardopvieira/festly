package com.projeto.festly.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Bloco de duração fixa derivado da agenda contínua. Útil para uma UI mais simples
 * que não suporta drag-select, mostrando "slots" prontos para clique.
 */
@Data
@Builder
@AllArgsConstructor
public class BlocoHorarioResponse {

    private LocalDateTime inicio;
    private LocalDateTime fim;
    private int duracaoMinutos;
    private BlocoStatus status;
}
