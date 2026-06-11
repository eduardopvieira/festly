package com.projeto.festly.service.payment.dto;

import java.math.BigDecimal;

public record WebhookEvento(
    String eventId,
    TipoEventoWebhook tipo,
    String providerChargeId,
    BigDecimal valor
) {}
