package com.projeto.festly.service.payment.asaas.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AsaasWebhookPayload(
    String id,
    String event,
    AsaasPaymentObject payment
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record AsaasPaymentObject(
        String id,
        String status,
        java.math.BigDecimal value
    ) {}
}
