package com.projeto.festly.service.payment.dto;
public record DadosCartao(
    String numero,
    String titular,
    String validadeMes,
    String validadeAno,
    String cvv,
    String cpfTitular,
    String cep,
    String numeroEndereco
) {}
