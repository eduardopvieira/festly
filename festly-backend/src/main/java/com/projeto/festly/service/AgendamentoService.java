package com.projeto.festly.service;

import com.projeto.festly.dto.AgendamentoRequest;
import com.projeto.festly.dto.AgendamentoResponse;
import com.projeto.festly.entity.Agendamento;
import com.projeto.festly.entity.Servico;
import com.projeto.festly.entity.StatusAgendamento;
import com.projeto.festly.entity.Usuario;
import com.projeto.festly.repository.AgendamentoRepository;
import com.projeto.festly.repository.ServicoRepository;
import com.projeto.festly.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.PessimisticLockingFailureException;
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
    }

    @Transactional(readOnly = true)
    public List<AgendamentoResponse> listarDoCliente(Long clienteId) {
        return repository.findByClienteIdOrderByInicioDesc(clienteId).stream()
                .map(AgendamentoResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AgendamentoResponse> listarDoPrestador(Long prestadorId) {
        return repository.findByPrestadorId(prestadorId).stream()
                .map(AgendamentoResponse::from)
                .toList();
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
}
