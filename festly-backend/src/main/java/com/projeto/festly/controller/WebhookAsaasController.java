package com.projeto.festly.controller;

import com.projeto.festly.entity.*;
import com.projeto.festly.repository.PagamentoRepository;
import com.projeto.festly.service.payment.PaymentProvider;
import com.projeto.festly.service.payment.dto.WebhookEvento;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/webhooks/asaas")
@RequiredArgsConstructor
@Slf4j
public class WebhookAsaasController {

    private final PaymentProvider paymentProvider;
    private final PagamentoRepository pagamentoRepo;

    @Value("${asaas.webhook-token}")
    private String expectedToken;

    @PostMapping
    @Transactional
    public ResponseEntity<Void> receber(
            @RequestBody String body,
            @RequestHeader Map<String, String> headers) {

        String token = headers.get("asaas-access-token");
        if (token == null) token = headers.get("Asaas-Access-Token");
        if (token == null || !token.equals(expectedToken)) {
            return ResponseEntity.status(401).build();
        }

        WebhookEvento evento = paymentProvider.parseWebhook(body, headers);

        Pagamento p = pagamentoRepo.findByProviderChargeId(evento.providerChargeId()).orElse(null);
        if (p == null) {
            log.warn("Webhook para cobrança desconhecida: {}", evento.providerChargeId());
            return ResponseEntity.ok().build();
        }

        switch (evento.tipo()) {
            case PAGAMENTO_CONFIRMADO -> confirmar(p);
            case PAGAMENTO_FALHOU, PAGAMENTO_EXPIRADO_REMOTO -> falhar(p);
            case ESTORNO_CONCLUIDO -> log.info("Estorno concluído no provider para {}", evento.providerChargeId());
            case IGNORADO -> log.debug("Evento ignorado para {}", evento.providerChargeId());
        }

        return ResponseEntity.ok().build();
    }

    private void confirmar(Pagamento p) {
        if (p.getStatus() == StatusPagamento.CONFIRMADO) return;
        if (p.getStatus() != StatusPagamento.AGUARDANDO) {
            log.warn("Confirmação ignorada — pagamento {} em estado {}", p.getId(), p.getStatus());
            return;
        }
        p.setStatus(StatusPagamento.CONFIRMADO);
        p.setConfirmedAt(LocalDateTime.now());
        for (ItemPagamento ip : p.getItens()) {
            Agendamento a = ip.getAgendamento();
            if (a.getStatus() == StatusAgendamento.AGUARDANDO_PAGAMENTO) {
                a.setStatus(StatusAgendamento.PENDENTE);
            }
        }
    }

    private void falhar(Pagamento p) {
        if (p.getStatus() != StatusPagamento.AGUARDANDO) return;
        p.setStatus(StatusPagamento.FALHOU);
        for (ItemPagamento ip : p.getItens()) {
            Agendamento a = ip.getAgendamento();
            if (a.getStatus() == StatusAgendamento.AGUARDANDO_PAGAMENTO) {
                a.setStatus(StatusAgendamento.PAGAMENTO_EXPIRADO);
            }
        }
    }
}
