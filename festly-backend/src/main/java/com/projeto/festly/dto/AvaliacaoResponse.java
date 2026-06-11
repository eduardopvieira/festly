package com.projeto.festly.dto;

import com.projeto.festly.entity.Avaliacao;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AvaliacaoResponse {

    private Long id;
    private Long agendamentoId;
    private Long servicoId;
    private Integer nota;
    private String comentario;
    private LocalDateTime createdAt;

    public static AvaliacaoResponse from(Avaliacao avaliacao) {
        AvaliacaoResponse response = new AvaliacaoResponse();
        response.setId(avaliacao.getId());
        response.setAgendamentoId(avaliacao.getAgendamento().getId());
        response.setServicoId(avaliacao.getAgendamento().getServico().getId());
        response.setNota(avaliacao.getNota());
        response.setComentario(avaliacao.getComentario());
        response.setCreatedAt(avaliacao.getCreatedAt());
        return response;
    }
}
