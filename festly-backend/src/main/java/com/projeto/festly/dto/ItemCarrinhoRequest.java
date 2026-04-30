package com.projeto.festly.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class ItemCarrinhoRequest {
    @NotNull(message = "A data do evento é obrigatória")
    @FutureOrPresent(message = "A data deve ser hoje ou no futuro")
    private LocalDate dataEvento;

    private LocalTime horarioEvento;
}