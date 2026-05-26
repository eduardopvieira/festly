package com.projeto.festly.service.payment.asaas;

import com.projeto.festly.service.payment.dto.StatusCobranca;
import com.projeto.festly.service.payment.dto.TipoEventoWebhook;

public final class AsaasStatusMapper {
    private AsaasStatusMapper() {}

    public static StatusCobranca toStatusCobranca(String asaasStatus) {
        if (asaasStatus == null) return StatusCobranca.AGUARDANDO;
        return switch (asaasStatus.toUpperCase()) {
            case "CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH" -> StatusCobranca.CONFIRMADO;
            case "OVERDUE" -> StatusCobranca.EXPIRADO;
            case "REFUNDED", "REFUND_REQUESTED", "REFUND_IN_PROGRESS",
                 "CHARGEBACK_REQUESTED", "CHARGEBACK_DISPUTE" -> StatusCobranca.FALHOU;
            default -> StatusCobranca.AGUARDANDO;
        };
    }

    public static TipoEventoWebhook toTipoEvento(String event) {
        if (event == null) return TipoEventoWebhook.IGNORADO;
        return switch (event.toUpperCase()) {
            case "PAYMENT_CONFIRMED", "PAYMENT_RECEIVED" -> TipoEventoWebhook.PAGAMENTO_CONFIRMADO;
            case "PAYMENT_OVERDUE" -> TipoEventoWebhook.PAGAMENTO_EXPIRADO_REMOTO;
            case "PAYMENT_CHARGEBACK_REQUESTED", "PAYMENT_REFUNDED" -> TipoEventoWebhook.ESTORNO_CONCLUIDO;
            case "PAYMENT_DELETED" -> TipoEventoWebhook.PAGAMENTO_FALHOU;
            default -> TipoEventoWebhook.IGNORADO;
        };
    }
}
