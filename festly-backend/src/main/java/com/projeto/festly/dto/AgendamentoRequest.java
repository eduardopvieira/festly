package com.projeto.festly.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AgendamentoRequest {

    @NotNull(message = "O ID do serviço é obrigatório")
    private Long servicoId;

    @NotNull(message = "O ID do cliente é obrigatório")
    private Long clienteId;

    @NotNull(message = "O início é obrigatório")
    private LocalDateTime inicio;

    @NotNull(message = "O fim é obrigatório")
    private LocalDateTime fim;

    private Integer numeroPessoas;
}
