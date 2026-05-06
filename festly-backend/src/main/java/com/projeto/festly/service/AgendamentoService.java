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

    /**
     * Cria um agendamento. Camadas de proteção contra dupla reserva:
     *  1. Transação SERIALIZABLE para que checks e insert sejam atômicos.
     *  2. Verificação por overlap em SQL (existsConflict) antes de inserir.
     *  3. EXCLUDE constraint do PostgreSQL (no_overlap_agendamento) como
     *     última linha de defesa — converte falha em DataIntegrityViolation.
     */
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

        if (repository.existsConflict(servico.getId(), inicio, fim, StatusAgendamento.CANCELADO)) {
            throw new IllegalStateException("Este horário já foi reservado.");
        }

        Agendamento agendamento = Agendamento.builder()
                .servico(servico)
                .cliente(cliente)
                .inicio(inicio)
                .fim(fim)
                .status(StatusAgendamento.PENDENTE)
                .build();

        try {
            return AgendamentoResponse.from(repository.saveAndFlush(agendamento));
        } catch (DataIntegrityViolationException | PessimisticLockingFailureException ex) {
            throw new IllegalStateException("Este horário acabou de ser reservado por outro cliente.");
        }
    }

    @Transactional
    public void cancelar(Long agendamentoId, Long clienteId) {
        Agendamento agendamento = repository.findById(agendamentoId)
                .orElseThrow(() -> new EntityNotFoundException("Agendamento não encontrado: " + agendamentoId));
        if (!agendamento.getCliente().getId().equals(clienteId)) {
            throw new IllegalStateException("Você não pode cancelar este agendamento.");
        }
        if (agendamento.getStatus() == StatusAgendamento.CANCELADO) return;
        agendamento.setStatus(StatusAgendamento.CANCELADO);
    }

    @Transactional(readOnly = true)
    public List<AgendamentoResponse> listarDoCliente(Long clienteId) {
        return repository.findByClienteIdOrderByInicioDesc(clienteId).stream()
                .map(AgendamentoResponse::from)
                .toList();
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
