package com.projeto.festly.service.payment.asaas.dto;

import java.math.BigDecimal;

public record AsaasChargeRequest(
    String customer,
    String billingType,
    BigDecimal value,
    String dueDate,
    String description,
    AsaasCreditCard creditCard,
    AsaasCreditCardHolder creditCardHolder
) {
    public record AsaasCreditCard(
        String holderName, String number,
        String expiryMonth, String expiryYear, String ccv
    ) {}
    public record AsaasCreditCardHolder(
        String name, String email, String cpfCnpj,
        String postalCode, String addressNumber
    ) {}
}
