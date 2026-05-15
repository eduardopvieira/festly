package com.projeto.festly.dto;

import com.projeto.festly.entity.Agendamento;
import com.projeto.festly.entity.StatusAgendamento;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AgendamentoResponse {

    private Long id;
    private Long servicoId;
    private String nomeServico;
    private Long clienteId;
    private String nomeCliente;
    private LocalDateTime inicio;
    private LocalDateTime fim;
    private StatusAgendamento status;
    private Integer numeroPessoas;

    public static AgendamentoResponse from(Agendamento agendamento) {
        AgendamentoResponse response = new AgendamentoResponse();
        response.setId(agendamento.getId());
        response.setServicoId(agendamento.getServico().getId());
        response.setNomeServico(agendamento.getServico().getNome());
        response.setClienteId(agendamento.getCliente().getId());
        response.setNomeCliente(agendamento.getCliente().getNome());
        response.setInicio(agendamento.getInicio());
        response.setFim(agendamento.getFim());
        response.setStatus(agendamento.getStatus());
        response.setNumeroPessoas(agendamento.getNumeroPessoas());
        return response;
    }
}
