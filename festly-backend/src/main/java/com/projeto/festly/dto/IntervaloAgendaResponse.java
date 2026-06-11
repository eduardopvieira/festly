package com.projeto.festly.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Intervalo contínuo da agenda de um serviço, devolvido pelo endpoint
 * de listagem de disponibilidade. O cliente usa esse modelo para renderizar
 * a agenda como faixas (preferencial) ou para derivar blocos de duração fixa.
 */
@Data
@Builder
@AllArgsConstructor
public class IntervaloAgendaResponse {

    private LocalDateTime inicio;
    private LocalDateTime fim;
    private BlocoStatus status;
}
