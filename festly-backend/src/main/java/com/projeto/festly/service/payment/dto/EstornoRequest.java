package com.projeto.festly.service.payment.dto;

import java.math.BigDecimal;

public record EstornoRequest(
    String providerChargeId,
    BigDecimal valor,
    String motivo
) {}
