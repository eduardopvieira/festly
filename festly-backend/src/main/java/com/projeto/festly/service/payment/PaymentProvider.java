package com.projeto.festly.service.payment;

import com.projeto.festly.service.payment.dto.*;

import java.util.Map;

public interface PaymentProvider {
    CobrancaCriada criarCobranca(NovaCobrancaRequest req);
    StatusCobranca consultarStatus(String providerChargeId);
    Estorno estornar(EstornoRequest req);
    WebhookEvento parseWebhook(String body, Map<String, String> headers);
    String nome();
}
