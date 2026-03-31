package com.projeto.festly.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FornecedorRequest {

    @NotBlank(message = "Nome é obrigatório")
    private String nome;

    private String email;

    private String telefone;

    private String cnpj;

    private String descricao;
}
