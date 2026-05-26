package com.projeto.festly.service.payment.asaas.dto;

public record AsaasPixInfoResponse(
    String encodedImage,
    String payload,
    String expirationDate
) {}
