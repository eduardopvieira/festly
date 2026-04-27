package com.projeto.festly.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AgendamentoRequest {

    @NotNull(message = "O ID do serviço é obrigatório")
    private Long servicoId;

    @NotNull(message = "O ID do cliente é obrigatório")
    private Long clienteId;

    @NotNull(message = "A data do evento é obrigatória")
    @FutureOrPresent(message = "A data do agendamento não pode estar no passado")
    private LocalDate dataEvento;
}