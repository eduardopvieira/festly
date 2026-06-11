package com.projeto.festly.dto;

import jakarta.validation.constraints.NotBlank;

public record DadosCartaoRequest(
    @NotBlank String numero,
    @NotBlank String titular,
    @NotBlank String validadeMes,
    @NotBlank String validadeAno,
    @NotBlank String cvv,
    @NotBlank String cpfTitular,
    @NotBlank String cep,
    @NotBlank String numeroEndereco
) {}
