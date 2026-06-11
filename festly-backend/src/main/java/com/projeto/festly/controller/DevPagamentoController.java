package com.projeto.festly.controller;

import com.projeto.festly.entity.Agendamento;
import com.projeto.festly.entity.ItemPagamento;
import com.projeto.festly.entity.Pagamento;
import com.projeto.festly.entity.StatusAgendamento;
import com.projeto.festly.entity.StatusPagamento;
import com.projeto.festly.repository.PagamentoRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

/**
 * Endpoints de DESENVOLVIMENTO para simular eventos de pagamento sem o provider real.
 * Identificam o pagamento pelo CÓDIGO PIX copia-e-cola (o mesmo texto que gera o QR
 * exibido na tela) — basta colar o código mostrado no checkout, sem precisar do id
 * nem do providerChargeId.
 *
 * <p>Ativo SOMENTE quando {@code payment.provider=fake}. Em produção (Asaas) o bean
 * não é registrado e o {@code SecurityConfig} não libera {@code /dev/**}.
 *
 * <pre>
 * curl -X POST http://localhost:8080/dev/pagamentos/confirmar \
 *      -H "Content-Type: application/json" \
 *      -d '{"codigo":"00020126...FAKE"}'
 *
 * curl -X POST http://localhost:8080/dev/pagamentos/falhar \
 *      -H "Content-Type: application/json" \
 *      -d '{"codigo":"00020126...FAKE"}'
 * </pre>
 */
@RestController
@RequestMapping("/dev/pagamentos")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "payment.provider", havingValue = "fake")
public class DevPagamentoController {

    private final PagamentoRepository pagamentoRepo;

    public record CodigoRequest(String codigo) {}

    @PostMapping("/confirmar")
    @Transactional
    public ResponseEntity<String> confirmar(@RequestBody CodigoRequest req) {
        Pagamento p = buscarPorCodigo(req);

        if (p.getStatus() == StatusPagamento.CONFIRMADO) {
            return ResponseEntity.ok("Pagamento " + p.getId() + " já estava CONFIRMADO.");
        }
        if (p.getStatus() != StatusPagamento.AGUARDANDO) {
            return ResponseEntity.badRequest()
                .body("Pagamento " + p.getId() + " está em " + p.getStatus()
                    + "; apenas AGUARDANDO pode ser confirmado.");
        }

        p.setStatus(StatusPagamento.CONFIRMADO);
        p.setConfirmedAt(LocalDateTime.now());
        for (ItemPagamento ip : p.getItens()) {
            Agendamento a = ip.getAgendamento();
            if (a.getStatus() == StatusAgendamento.AGUARDANDO_PAGAMENTO) {
                a.setStatus(StatusAgendamento.PENDENTE);
            }
        }
        return ResponseEntity.ok("Pagamento " + p.getId() + " CONFIRMADO (dev). Agendamentos movidos para PENDENTE.");
    }

    @PostMapping("/falhar")
    @Transactional
    public ResponseEntity<String> falhar(@RequestBody CodigoRequest req) {
        Pagamento p = buscarPorCodigo(req);

        if (p.getStatus() != StatusPagamento.AGUARDANDO) {
            return ResponseEntity.badRequest()
                .body("Pagamento " + p.getId() + " está em " + p.getStatus()
                    + "; apenas AGUARDANDO pode falhar.");
        }

        p.setStatus(StatusPagamento.FALHOU);
        for (ItemPagamento ip : p.getItens()) {
            Agendamento a = ip.getAgendamento();
            if (a.getStatus() == StatusAgendamento.AGUARDANDO_PAGAMENTO) {
                a.setStatus(StatusAgendamento.PAGAMENTO_EXPIRADO);
            }
        }
        return ResponseEntity.ok("Pagamento " + p.getId() + " marcado como FALHOU (dev). Horários liberados.");
    }

    private Pagamento buscarPorCodigo(CodigoRequest req) {
        if (req == null || req.codigo() == null || req.codigo().isBlank()) {
            throw new IllegalArgumentException("Informe o código PIX no campo 'codigo'.");
        }
        return pagamentoRepo.findFirstByPixQrCodeOrderByIdDesc(req.codigo().trim())
            .orElseThrow(() -> new EntityNotFoundException(
                "Nenhum pagamento PIX encontrado com esse código."));
    }
}
