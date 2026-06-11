package com.projeto.festly.service.payment.asaas;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.projeto.festly.entity.MetodoPagamento;
import com.projeto.festly.service.payment.PaymentProvider;
import com.projeto.festly.service.payment.PaymentProviderException;
import com.projeto.festly.service.payment.asaas.dto.*;
import com.projeto.festly.service.payment.dto.*;
import lombok.RequiredArgsConstructor;

import java.time.LocalDate;
import java.util.Map;

@RequiredArgsConstructor
public class AsaasPaymentProvider implements PaymentProvider {

    private final AsaasHttpClient http;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public CobrancaCriada criarCobranca(NovaCobrancaRequest req) {
        AsaasCustomerResponse customer = http.post("/customers",
            new AsaasCustomerRequest(req.clienteNome(), req.clienteCpf(), req.clienteEmail()),
            AsaasCustomerResponse.class, null);

        AsaasChargeRequest.AsaasCreditCard cc = null;
        AsaasChargeRequest.AsaasCreditCardHolder holder = null;
        if (req.cartao() != null) {
            cc = new AsaasChargeRequest.AsaasCreditCard(
                req.cartao().titular(), req.cartao().numero(),
                req.cartao().validadeMes(), req.cartao().validadeAno(), req.cartao().cvv());
            holder = new AsaasChargeRequest.AsaasCreditCardHolder(
                req.cartao().titular(), req.clienteEmail(), req.cartao().cpfTitular(),
                req.cartao().cep(), req.cartao().numeroEndereco());
        }
        String dueDate = (req.expiresAt() != null ? req.expiresAt().toLocalDate() : LocalDate.now().plusDays(1)).toString();

        AsaasChargeResponse charge = http.post("/payments",
            new AsaasChargeRequest(
                customer.id(),
                req.metodo() == MetodoPagamento.PIX ? "PIX" : "CREDIT_CARD",
                req.valor(),
                dueDate,
                req.descricao(),
                cc, holder),
            AsaasChargeResponse.class, req.idempotencyKey());

        StatusCobranca status = AsaasStatusMapper.toStatusCobranca(charge.status());

        String qr = null, qrBase64 = null;
        if (req.metodo() == MetodoPagamento.PIX) {
            AsaasPixInfoResponse pix = http.get("/payments/" + charge.id() + "/pixQrCode",
                AsaasPixInfoResponse.class);
            qr = pix.payload();
            qrBase64 = pix.encodedImage();
        }

        return new CobrancaCriada(charge.id(), status, qr, qrBase64, req.expiresAt());
    }

    @Override
    public StatusCobranca consultarStatus(String providerChargeId) {
        AsaasChargeResponse charge = http.get("/payments/" + providerChargeId, AsaasChargeResponse.class);
        return AsaasStatusMapper.toStatusCobranca(charge.status());
    }

    @Override
    public Estorno estornar(EstornoRequest req) {
        AsaasRefundResponse r = http.post(
            "/payments/" + req.providerChargeId() + "/refund",
            new AsaasRefundRequest(req.valor(), req.motivo()),
            AsaasRefundResponse.class, null);
        StatusEstorno s = switch (r.status() == null ? "" : r.status().toUpperCase()) {
            case "REFUNDED" -> StatusEstorno.CONCLUIDO;
            case "REFUND_REQUESTED", "REFUND_IN_PROGRESS" -> StatusEstorno.PROCESSANDO;
            default -> StatusEstorno.PROCESSANDO;
        };
        return new Estorno(r.id(), s);
    }

    @Override
    public WebhookEvento parseWebhook(String body, Map<String, String> headers) {
        try {
            JsonNode root = objectMapper.readTree(body);
            String eventId = root.path("id").asText(null);
            String event = root.path("event").asText(null);
            String chargeId = root.path("payment").path("id").asText(null);
            java.math.BigDecimal valor = root.path("payment").path("value").isMissingNode()
                ? null : root.path("payment").path("value").decimalValue();
            return new WebhookEvento(eventId, AsaasStatusMapper.toTipoEvento(event), chargeId, valor);
        } catch (Exception e) {
            throw new PaymentProviderException("Webhook Asaas malformado", e);
        }
    }

    @Override
    public String nome() { return "asaas"; }
}
