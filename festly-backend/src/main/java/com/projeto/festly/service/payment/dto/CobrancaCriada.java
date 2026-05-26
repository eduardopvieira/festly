package com.projeto.festly.service.payment.dto;

import java.time.LocalDateTime;

public record CobrancaCriada(
    String providerChargeId,
    StatusCobranca status,
    String pixQrCode,
    String pixQrCodeBase64,
    LocalDateTime expiresAt
) {}
