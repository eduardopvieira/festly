package com.projeto.festly.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ItemCarrinhoRequest {

    @NotNull(message = "O início é obrigatório")
    private LocalDateTime inicio;

    @NotNull(message = "O fim é obrigatório")
    private LocalDateTime fim;

    private Integer numeroPessoas;
}
