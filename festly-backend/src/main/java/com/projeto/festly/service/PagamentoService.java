package com.projeto.festly.service;

import com.projeto.festly.dto.PagamentoResponse;
import com.projeto.festly.entity.*;
import com.projeto.festly.repository.PagamentoRepository;
import com.projeto.festly.service.payment.PaymentProvider;
import com.projeto.festly.service.payment.dto.StatusCobranca;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class PagamentoService {

    private final PagamentoRepository repository;
    private final PaymentProvider paymentProvider;

    @Transactional
    public PagamentoResponse buscar(Long pagamentoId, Long clienteIdAutenticado) {
        Pagamento p = repository.findById(pagamentoId)
            .orElseThrow(() -> new EntityNotFoundException("Pagamento não encontrado: " + pagamentoId));
        if (!p.getCliente().getId().equals(clienteIdAutenticado)) {
            throw new AccessDeniedException("Você não tem permissão sobre este pagamento.");
        }

        // Expiração lazy
        if (p.getStatus() == StatusPagamento.AGUARDANDO
            && p.getExpiresAt() != null
            && p.getExpiresAt().isBefore(LocalDateTime.now())
            && p.getProviderChargeId() != null) {
            try {
                StatusCobranca remoto = paymentProvider.consultarStatus(p.getProviderChargeId());
                if (remoto == StatusCobranca.CONFIRMADO) {
                    confirmar(p);
                } else {
                    expirar(p);
                }
            } catch (Exception e) {
                log.warn("Falha ao consultar provider durante expiração lazy do pagamento {}: {}",
                    p.getId(), e.toString());
            }
        }

        return PagamentoResponse.from(p);
    }

    @Transactional(readOnly = true)
    public Page<PagamentoResponse> listarMeus(Long clienteId, Pageable pageable) {
        return repository.findByClienteIdOrderByCreatedAtDesc(clienteId, pageable)
            .map(PagamentoResponse::from);
    }

    private void confirmar(Pagamento p) {
        p.setStatus(StatusPagamento.CONFIRMADO);
        p.setConfirmedAt(LocalDateTime.now());
        for (ItemPagamento ip : p.getItens()) {
            Agendamento a = ip.getAgendamento();
            if (a.getStatus() == StatusAgendamento.AGUARDANDO_PAGAMENTO) {
                a.setStatus(StatusAgendamento.PENDENTE);
            }
        }
    }

    private void expirar(Pagamento p) {
        p.setStatus(StatusPagamento.EXPIRADO);
        for (ItemPagamento ip : p.getItens()) {
            Agendamento a = ip.getAgendamento();
            if (a.getStatus() == StatusAgendamento.AGUARDANDO_PAGAMENTO) {
                a.setStatus(StatusAgendamento.PAGAMENTO_EXPIRADO);
            }
        }
    }
}
