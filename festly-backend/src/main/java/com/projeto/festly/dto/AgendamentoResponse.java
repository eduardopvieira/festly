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
    private String emailCliente;
    private LocalDateTime inicio;
    private LocalDateTime fim;
    private StatusAgendamento status;
    private Integer numeroPessoas;
    private String rua;
    private String numero;
    private String bairro;
    private String cidade;
    private String estado;
    private String cep;
    private String complemento;
    private String tipoEvento;
    private String observacoes;
    private LocalDateTime createdAt;
    private boolean jaAvaliado;

    public static AgendamentoResponse from(Agendamento agendamento) {
        return from(agendamento, false);
    }

    public static AgendamentoResponse from(Agendamento agendamento, boolean jaAvaliado) {
        AgendamentoResponse response = new AgendamentoResponse();
        response.setId(agendamento.getId());
        response.setServicoId(agendamento.getServico().getId());
        response.setNomeServico(agendamento.getServico().getNome());
        response.setClienteId(agendamento.getCliente().getId());
        response.setNomeCliente(agendamento.getCliente().getNome());
        response.setEmailCliente(agendamento.getCliente().getEmail());
        response.setInicio(agendamento.getInicio());
        response.setFim(agendamento.getFim());
        response.setStatus(agendamento.getStatus());
        response.setNumeroPessoas(agendamento.getNumeroPessoas());
        response.setRua(agendamento.getRua());
        response.setNumero(agendamento.getNumero());
        response.setBairro(agendamento.getBairro());
        response.setCidade(agendamento.getCidade());
        response.setEstado(agendamento.getEstado());
        response.setCep(agendamento.getCep());
        response.setComplemento(agendamento.getComplemento());
        response.setTipoEvento(agendamento.getTipoEvento());
        response.setObservacoes(agendamento.getObservacoes());
        response.setCreatedAt(agendamento.getCreatedAt());
        response.setJaAvaliado(jaAvaliado);
        return response;
    }
}
