package com.projeto.festly.service.payment.dto;
public enum TipoEventoWebhook {
    PAGAMENTO_CONFIRMADO,
    PAGAMENTO_FALHOU,
    PAGAMENTO_EXPIRADO_REMOTO,
    ESTORNO_CONCLUIDO,
    IGNORADO
}
