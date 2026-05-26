package com.projeto.festly.service;

import com.projeto.festly.dto.AgendamentoRequest;
import com.projeto.festly.dto.AgendamentoResponse;
import com.projeto.festly.entity.Agendamento;
import com.projeto.festly.entity.ItemPagamento;
import com.projeto.festly.entity.Pagamento;
import com.projeto.festly.entity.Servico;
import com.projeto.festly.entity.StatusAgendamento;
import com.projeto.festly.entity.StatusItemPagamento;
import com.projeto.festly.entity.StatusPagamento;
import com.projeto.festly.entity.Usuario;
import com.projeto.festly.repository.AgendamentoRepository;
import com.projeto.festly.repository.AvaliacaoRepository;
import com.projeto.festly.repository.ItemPagamentoRepository;
import com.projeto.festly.repository.PagamentoRepository;
import com.projeto.festly.repository.ServicoRepository;
import com.projeto.festly.repository.UsuarioRepository;
import com.projeto.festly.service.payment.PaymentProvider;
import com.projeto.festly.service.payment.dto.EstornoRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AgendamentoService {

    private final AgendamentoRepository repository;
    private final ServicoRepository servicoRepository;
    private final UsuarioRepository usuarioRepository;
    private final DisponibilidadeService disponibilidadeService;
    private final AvaliacaoRepository avaliacaoRepository;
    private final ItemPagamentoRepository itemPagamentoRepository;
    private final PagamentoRepository pagamentoRepository;
    private final PaymentProvider paymentProvider;

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public AgendamentoResponse agendar(AgendamentoRequest request) {
        Servico servico = servicoRepository.findById(request.getServicoId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Serviço não encontrado: " + request.getServicoId()));

        Usuario cliente = usuarioRepository.findById(request.getClienteId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Cliente não encontrado: " + request.getClienteId()));

        LocalDateTime inicio = request.getInicio();
        LocalDateTime fim = request.getFim();
        validarIntervalo(inicio, fim);

        if (!disponibilidadeService.intervaloDentroDaAgenda(servico.getId(), inicio, fim)) {
            throw new IllegalStateException("Este horário está fora da agenda do prestador.");
        }

        if (repository.existsActiveConflict(servico.getId(), inicio, fim)) {
            throw new IllegalStateException("Este horário já foi reservado.");
        }

        Agendamento agendamento = Agendamento.builder()
                .servico(servico)
                .cliente(cliente)
                .inicio(inicio)
                .fim(fim)
                .status(StatusAgendamento.PENDENTE)
                .numeroPessoas(request.getNumeroPessoas())
                .build();

        try {
            return AgendamentoResponse.from(repository.saveAndFlush(agendamento));
        } catch (DataIntegrityViolationException | PessimisticLockingFailureException ex) {
            throw new IllegalStateException("Este horário acabou de ser reservado por outro cliente.");
        }
    }

    @Transactional
    public AgendamentoResponse confirmar(Long agendamentoId, Long prestadorId) {
        Agendamento agendamento = buscarEntidade(agendamentoId);
        validarDonoPrestador(agendamento, prestadorId);
        if (agendamento.getStatus() != StatusAgendamento.PENDENTE) {
            throw new IllegalStateException("Apenas agendamentos PENDENTE podem ser confirmados.");
        }
        agendamento.setStatus(StatusAgendamento.CONFIRMADO);
        return AgendamentoResponse.from(agendamento);
    }

    @Transactional
    public AgendamentoResponse rejeitar(Long agendamentoId, Long prestadorId) {
        Agendamento agendamento = buscarEntidade(agendamentoId);
        validarDonoPrestador(agendamento, prestadorId);
        if (agendamento.getStatus() != StatusAgendamento.PENDENTE) {
            throw new IllegalStateException("Apenas agendamentos PENDENTE podem ser rejeitados.");
        }
        agendamento.setStatus(StatusAgendamento.REJEITADO);
        estornarItemSeAplicavel(agendamentoId, "Prestador rejeitou agendamento");
        return AgendamentoResponse.from(agendamento);
    }

    @Transactional
    public void cancelar(Long agendamentoId, Long clienteId) {
        Agendamento agendamento = buscarEntidade(agendamentoId);
        if (!agendamento.getCliente().getId().equals(clienteId)) {
            throw new IllegalStateException("Você não pode cancelar este agendamento.");
        }
        if (agendamento.getStatus() == StatusAgendamento.CANCELADO) return;
        if (agendamento.getStatus() != StatusAgendamento.PENDENTE) {
            throw new IllegalStateException("Apenas agendamentos PENDENTE podem ser cancelados pelo cliente.");
        }
        agendamento.setStatus(StatusAgendamento.CANCELADO);
        estornarItemSeAplicavel(agendamentoId, "Cliente cancelou agendamento");
    }

    @Transactional
    public AgendamentoResponse concluir(Long agendamentoId, Long usuarioId) {
        Agendamento agendamento = buscarEntidade(agendamentoId);

        boolean ehCliente = agendamento.getCliente().getId().equals(usuarioId);
        boolean ehPrestador = agendamento.getServico().getUsuario().getId().equals(usuarioId);
        if (!ehCliente && !ehPrestador) {
            throw new AccessDeniedException("Você não tem permissão sobre este agendamento.");
        }

        if (agendamento.getStatus() == StatusAgendamento.CONCLUIDO) {
            boolean jaAvaliado = avaliacaoRepository.existsByAgendamentoId(agendamento.getId());
            return AgendamentoResponse.from(agendamento, jaAvaliado);
        }

        if (agendamento.getStatus() != StatusAgendamento.CONFIRMADO) {
            throw new IllegalArgumentException(
                    "Apenas agendamentos CONFIRMADO podem ser concluídos.");
        }

        if (LocalDateTime.now().isBefore(agendamento.getFim())) {
            throw new IllegalArgumentException(
                    "Aguarde o término do serviço para concluí-lo.");
        }

        agendamento.setStatus(StatusAgendamento.CONCLUIDO);
        boolean jaAvaliado = avaliacaoRepository.existsByAgendamentoId(agendamento.getId());
        return AgendamentoResponse.from(agendamento, jaAvaliado);
    }

    @Transactional(readOnly = true)
    public Page<AgendamentoResponse> listarDoCliente(Long clienteId, boolean ativo, Pageable pageable) {
        Page<Agendamento> page = ativo
                ? repository.findAtivosByClienteId(clienteId, pageable)
                : repository.findHistoricoByClienteId(clienteId, pageable);
        return page.map(this::toResponseComAvaliacaoFlag);
    }

    @Transactional(readOnly = true)
    public Page<AgendamentoResponse> listarDoPrestador(Long prestadorId, boolean pendente, Pageable pageable) {
        Page<Agendamento> page = pendente
                ? repository.findPendentesByPrestadorId(prestadorId, pageable)
                : repository.findHistoricoByPrestadorId(prestadorId, pageable);
        return page.map(this::toResponseComAvaliacaoFlag);
    }

    private AgendamentoResponse toResponseComAvaliacaoFlag(Agendamento ag) {
        boolean jaAvaliado = ag.getStatus() == StatusAgendamento.CONCLUIDO
                && avaliacaoRepository.existsByAgendamentoId(ag.getId());
        return AgendamentoResponse.from(ag, jaAvaliado);
    }

    private Agendamento buscarEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Agendamento não encontrado: " + id));
    }

    private void validarDonoPrestador(Agendamento agendamento, Long prestadorId) {
        if (!agendamento.getServico().getUsuario().getId().equals(prestadorId)) {
            throw new AccessDeniedException("Você não tem permissão sobre este agendamento.");
        }
    }

    static void validarIntervalo(LocalDateTime inicio, LocalDateTime fim) {
        if (inicio == null || fim == null) {
            throw new IllegalArgumentException("Início e fim são obrigatórios.");
        }
        if (!inicio.isBefore(fim)) {
            throw new IllegalArgumentException("O fim deve ser posterior ao início.");
        }
        if (inicio.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("O horário escolhido já passou.");
        }
    }

    private void estornarItemSeAplicavel(Long agendamentoId, String motivo) {
        itemPagamentoRepository.findByAgendamentoId(agendamentoId).ifPresent(item -> {
            if (item.getStatus() != StatusItemPagamento.ATIVO) return;
            Pagamento p = item.getPagamento();
            StatusPagamento ps = p.getStatus();
            if (ps != StatusPagamento.CONFIRMADO && ps != StatusPagamento.ESTORNADO_PARCIAL) return;

            paymentProvider.estornar(new EstornoRequest(
                p.getProviderChargeId(), item.getValor(), motivo));

            item.setStatus(StatusItemPagamento.ESTORNADO);
            itemPagamentoRepository.save(item);

            long total = p.getItens().size();
            long estornados = p.getItens().stream()
                .filter(i -> i.getId().equals(item.getId())
                    || i.getStatus() == StatusItemPagamento.ESTORNADO)
                .count();
            p.setStatus(estornados >= total
                ? StatusPagamento.ESTORNADO_TOTAL
                : StatusPagamento.ESTORNADO_PARCIAL);
            pagamentoRepository.save(p);
        });
    }
}
