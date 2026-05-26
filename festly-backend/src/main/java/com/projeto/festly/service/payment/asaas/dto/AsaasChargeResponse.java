package com.projeto.festly.service.payment.asaas.dto;

public record AsaasChargeResponse(
    String id,
    String status,
    String customer,
    String billingType,
    String invoiceUrl,
    String dueDate
) {}
