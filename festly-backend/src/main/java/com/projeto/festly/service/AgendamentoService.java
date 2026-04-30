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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AgendamentoService {

    private final AgendamentoRepository repository;
    private final ServicoRepository servicoRepository;
    private final UsuarioRepository usuarioRepository;
    private final DisponibilidadeService disponibilidadeService;

    @Transactional
    public AgendamentoResponse agendar(AgendamentoRequest request) {
        Servico servico = servicoRepository.findById(request.getServicoId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Serviço não encontrado: " + request.getServicoId()));

        Usuario cliente = usuarioRepository.findById(request.getClienteId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Cliente não encontrado: " + request.getClienteId()));

        LocalDateTime momento = LocalDateTime.of(request.getDataEvento(), request.getHorarioEvento());
        if (momento.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("O horário escolhido já passou.");
        }

        boolean dentroDaAgenda = disponibilidadeService.horarioPermitido(
                request.getServicoId(),
                request.getDataEvento(),
                request.getHorarioEvento()
        );
        if (!dentroDaAgenda) {
            throw new IllegalStateException("Este horário está fora da agenda do prestador.");
        }

        boolean jaReservado = repository.existsByServicoIdAndDataEventoAndHorarioEventoAndStatusNot(
                request.getServicoId(),
                request.getDataEvento(),
                request.getHorarioEvento(),
                StatusAgendamento.CANCELADO
        );
        if (jaReservado) {
            throw new IllegalStateException("Este horário já foi reservado.");
        }

        Agendamento agendamento = Agendamento.builder()
                .servico(servico)
                .cliente(cliente)
                .dataEvento(request.getDataEvento())
                .horarioEvento(request.getHorarioEvento())
                .status(StatusAgendamento.PENDENTE)
                .build();

        try {
            return AgendamentoResponse.from(repository.saveAndFlush(agendamento));
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalStateException("Este horário acabou de ser reservado por outro cliente.");
        }
    }

    @Transactional(readOnly = true)
    public List<String> buscarDatasOcupadas(Long servicoId) {
        if (!servicoRepository.existsById(servicoId)) {
            throw new EntityNotFoundException("Serviço não encontrado: " + servicoId);
        }
        return repository.findDatasOcupadasByServicoId(servicoId)
                .stream()
                .map(LocalDate::toString)
                .toList();
    }
}
