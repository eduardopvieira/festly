package com.projeto.festly.service.payment.asaas.dto;

import java.math.BigDecimal;

public record AsaasRefundRequest(BigDecimal value, String description) {}
