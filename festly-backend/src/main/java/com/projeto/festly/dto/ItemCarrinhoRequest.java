package com.projeto.festly.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ItemCarrinhoRequest {

    @NotNull(message = "O início é obrigatório")
    private LocalDateTime inicio;

    @NotNull(message = "O fim é obrigatório")
    private LocalDateTime fim;

    private Integer numeroPessoas;

    @NotBlank(message = "Rua é obrigatória")
    private String rua;

    @NotBlank(message = "Número é obrigatório")
    @Size(max = 20)
    private String numero;

    @NotBlank(message = "Bairro é obrigatório")
    @Size(max = 100)
    private String bairro;

    @NotBlank(message = "Cidade é obrigatória")
    @Size(max = 100)
    private String cidade;

    @NotBlank(message = "Estado é obrigatório")
    @Size(min = 2, max = 2, message = "Estado deve ter 2 caracteres (UF)")
    private String estado;

    @NotBlank(message = "CEP é obrigatório")
    @Size(max = 9)
    private String cep;

    @Size(max = 100)
    private String complemento;

    @Size(max = 100)
    private String tipoEvento;

    @Size(max = 2000)
    private String observacoes;
}
