package com.projeto.festly.service;

import com.projeto.festly.dto.AvaliacaoRequest;
import com.projeto.festly.dto.AvaliacaoResponse;
import com.projeto.festly.entity.Agendamento;
import com.projeto.festly.entity.Avaliacao;
import com.projeto.festly.entity.StatusAgendamento;
import com.projeto.festly.repository.AgendamentoRepository;
import com.projeto.festly.repository.AvaliacaoRepository;
import com.projeto.festly.repository.ServicoRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AvaliacaoService {

    private final AvaliacaoRepository avaliacaoRepository;
    private final AgendamentoRepository agendamentoRepository;
    private final ServicoRepository servicoRepository;

    @Transactional
    public AvaliacaoResponse criar(AvaliacaoRequest request, Long usuarioId) {
        Agendamento agendamento = agendamentoRepository.findById(request.getAgendamentoId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Agendamento não encontrado: " + request.getAgendamentoId()));

        if (!agendamento.getCliente().getId().equals(usuarioId)) {
            throw new AccessDeniedException("Você não pode avaliar este agendamento.");
        }

        if (agendamento.getStatus() != StatusAgendamento.CONCLUIDO) {
            throw new IllegalArgumentException(
                    "Só é possível avaliar serviços concluídos.");
        }

        if (avaliacaoRepository.existsByAgendamentoId(agendamento.getId())) {
            throw new IllegalStateException("Você já avaliou este agendamento.");
        }

        String comentario = request.getComentario();
        if (comentario != null) {
            comentario = comentario.trim();
            if (comentario.isEmpty()) comentario = null;
        }

        Avaliacao avaliacao = Avaliacao.builder()
                .agendamento(agendamento)
                .nota(request.getNota())
                .comentario(comentario)
                .build();

        try {
            return AvaliacaoResponse.from(avaliacaoRepository.saveAndFlush(avaliacao));
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalStateException("Você já avaliou este agendamento.");
        }
    }

    @Transactional(readOnly = true)
    public AvaliacaoResponse buscarPorAgendamento(Long agendamentoId, Long usuarioId) {
        Agendamento agendamento = agendamentoRepository.findById(agendamentoId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Agendamento não encontrado: " + agendamentoId));

        boolean ehCliente = agendamento.getCliente().getId().equals(usuarioId);
        boolean ehPrestador = agendamento.getServico().getUsuario().getId().equals(usuarioId);
        if (!ehCliente && !ehPrestador) {
            throw new AccessDeniedException("Você não tem permissão sobre este agendamento.");
        }

        Avaliacao avaliacao = avaliacaoRepository.findByAgendamentoId(agendamentoId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Avaliação não encontrada para o agendamento: " + agendamentoId));
        return AvaliacaoResponse.from(avaliacao);
    }

    @Transactional(readOnly = true)
    public Page<AvaliacaoResponse> listarPorServico(Long servicoId, Long usuarioId, Pageable pageable) {
        var servico = servicoRepository.findById(servicoId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Serviço não encontrado: " + servicoId));

        if (!servico.getUsuario().getId().equals(usuarioId)) {
            throw new AccessDeniedException("Você não tem permissão para ver as avaliações deste serviço.");
        }

        return avaliacaoRepository.findByServicoIdOrderByCreatedAtDesc(servicoId, pageable)
                .map(AvaliacaoResponse::from);
    }
}
