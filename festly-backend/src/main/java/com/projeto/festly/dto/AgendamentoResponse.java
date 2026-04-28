package com.projeto.festly.dto;

import com.projeto.festly.entity.Agendamento;
import com.projeto.festly.entity.StatusAgendamento;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class AgendamentoResponse {

    private Long id;
    private Long servicoId;
    private String nomeServico;
    private Long clienteId;
    private String nomeCliente;
    private LocalDate dataEvento;
    private LocalTime horarioEvento;
    private StatusAgendamento status;

    public static AgendamentoResponse from(Agendamento agendamento) {
        AgendamentoResponse response = new AgendamentoResponse();
        response.setId(agendamento.getId());
        response.setServicoId(agendamento.getServico().getId());
        response.setNomeServico(agendamento.getServico().getNome());
        response.setClienteId(agendamento.getCliente().getId());
        response.setNomeCliente(agendamento.getCliente().getNome());
        response.setDataEvento(agendamento.getDataEvento());
        response.setHorarioEvento(agendamento.getHorarioEvento());
        response.setStatus(agendamento.getStatus());
        return response;
    }
}