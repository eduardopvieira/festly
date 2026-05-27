package com.projeto.festly.service.payment.fake;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.projeto.festly.entity.MetodoPagamento;
import com.projeto.festly.service.payment.PaymentProvider;
import com.projeto.festly.service.payment.PaymentProviderException;
import com.projeto.festly.service.payment.asaas.AsaasStatusMapper;
import com.projeto.festly.service.payment.dto.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Implementação fake do {@link PaymentProvider} para dev local — sem chamar Asaas.
 *
 * <p>Ativada com {@code payment.provider=fake} no {@code application.properties}
 * (ou via env var {@code PAYMENT_PROVIDER=fake} se você externalizar).
 *
 * <h3>Comportamento</h3>
 * <ul>
 *   <li><b>PIX</b>: gera {@code providerChargeId} fake e um QR code dummy; status fica
 *       {@code AGUARDANDO} até alguém simular o webhook (ver abaixo) ou consultar
 *       o pagamento após {@code expires_at} passar (expiração lazy expira).</li>
 *   <li><b>Cartão</b>: aprova na hora se o número começar com {@code "4"} (família Visa-like);
 *       recusa qualquer outro lançando {@link PaymentProviderException} — útil para
 *       testar o caminho de falha.</li>
 *   <li><b>Estorno</b>: sempre sucesso.</li>
 *   <li><b>parseWebhook</b>: parseia o body real, mesmo formato do Asaas, e atualiza o
 *       estado interno para refletir nos próximos {@code consultarStatus}.</li>
 * </ul>
 *
 * <h3>Simulando confirmação de PIX em dev</h3>
 * <p>O front faz polling em {@code GET /pagamentos/{id}}. Para "pagar" o PIX
 * fake, chame o webhook manualmente:
 *
 * <pre>
 * curl -X POST http://localhost:8080/webhooks/asaas \
 *      -H "asaas-access-token: &lt;asaas.webhook-token configurado&gt;" \
 *      -H "Content-Type: application/json" \
 *      -d '{"id":"evt_dev_1","event":"PAYMENT_CONFIRMED","payment":{"id":"&lt;providerChargeId retornado no checkout&gt;"}}'
 * </pre>
 *
 * <p>O mesmo vale para simular falha ({@code PAYMENT_DELETED}) ou expiração remota
 * ({@code PAYMENT_OVERDUE}).
 *
 * <h3>Não usar em produção</h3>
 * <p>Esta classe vive em {@code src/main} (e não em {@code src/test}) só por
 * conveniência de dev. A condição {@code payment.provider=fake} mantém-na inativa
 * em qualquer ambiente que não declare explicitamente esse provider.
 */
@Component
@ConditionalOnProperty(name = "payment.provider", havingValue = "fake")
@Slf4j
public class FakePaymentProvider implements PaymentProvider {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, StatusCobranca> statusByCharge = new ConcurrentHashMap<>();

    @Override
    public CobrancaCriada criarCobranca(NovaCobrancaRequest req) {
        String chargeId = "fake_" + UUID.randomUUID();

        StatusCobranca status;
        String qr = null;
        String qrBase64 = null;

        if (req.metodo() == MetodoPagamento.PIX) {
            status = StatusCobranca.AGUARDANDO;
            // Payload único por cobrança (inclui o chargeId). Em dev isso permite
            // confirmar/falhar o pagamento pelo próprio código copia-e-cola exibido
            // na tela (ver DevPagamentoController). O front gera o QR a partir deste
            // texto, então não precisamos de imagem base64.
            qr = "00020126580014BR.GOV.BCB.PIX0136" + chargeId
                + "5204000053039865802BR5905FESTLY6009SAO PAULO62070503***6304FAKE";
            qrBase64 = null;
        } else {
            boolean aprovado = req.cartao() != null
                && req.cartao().numero() != null
                && req.cartao().numero().replace(" ", "").startsWith("4");
            if (!aprovado) {
                throw new PaymentProviderException(
                    "Cartão recusado (fake): em dev, só aprovam números começando com 4.");
            }
            status = StatusCobranca.CONFIRMADO;
        }

        statusByCharge.put(chargeId, status);
        log.info("[FAKE] Cobrança criada chargeId={} metodo={} valor={} status={}",
            chargeId, req.metodo(), req.valor(), status);

        return new CobrancaCriada(chargeId, status, qr, qrBase64, req.expiresAt());
    }

    @Override
    public StatusCobranca consultarStatus(String providerChargeId) {
        StatusCobranca s = statusByCharge.getOrDefault(providerChargeId, StatusCobranca.AGUARDANDO);
        log.debug("[FAKE] consultarStatus({}) = {}", providerChargeId, s);
        return s;
    }

    @Override
    public Estorno estornar(EstornoRequest req) {
        log.info("[FAKE] Estorno solicitado chargeId={} valor={} motivo={}",
            req.providerChargeId(), req.valor(), req.motivo());
        return new Estorno("ref_fake_" + UUID.randomUUID(), StatusEstorno.PROCESSANDO);
    }

    @Override
    public WebhookEvento parseWebhook(String body, Map<String, String> headers) {
        try {
            JsonNode root = objectMapper.readTree(body);
            String eventId = root.path("id").asText(null);
            String event = root.path("event").asText(null);
            String chargeId = root.path("payment").path("id").asText(null);
            BigDecimal valor = root.path("payment").path("value").isMissingNode()
                ? null
                : root.path("payment").path("value").decimalValue();

            TipoEventoWebhook tipo = AsaasStatusMapper.toTipoEvento(event);

            // Reflete a transição no estado interno para o próximo consultarStatus
            if (chargeId != null && statusByCharge.containsKey(chargeId)) {
                switch (tipo) {
                    case PAGAMENTO_CONFIRMADO -> statusByCharge.put(chargeId, StatusCobranca.CONFIRMADO);
                    case PAGAMENTO_FALHOU, PAGAMENTO_EXPIRADO_REMOTO ->
                        statusByCharge.put(chargeId, StatusCobranca.EXPIRADO);
                    default -> { /* IGNORADO e ESTORNO_CONCLUIDO não alteram status da cobrança */ }
                }
            }

            log.info("[FAKE] parseWebhook eventId={} event={} chargeId={} -> tipo={}",
                eventId, event, chargeId, tipo);

            return new WebhookEvento(eventId, tipo, chargeId, valor);
        } catch (Exception e) {
            throw new PaymentProviderException("Webhook fake malformado", e);
        }
    }

    @Override
    public String nome() {
        return "fake";
    }
}
