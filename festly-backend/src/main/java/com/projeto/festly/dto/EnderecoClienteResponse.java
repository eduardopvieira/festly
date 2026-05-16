package com.projeto.festly.dto;

import com.projeto.festly.entity.EnderecoCliente;
import lombok.Data;

@Data
public class EnderecoClienteResponse {

    private Long id;
    private String rua;
    private String numero;
    private String bairro;
    private String cidade;
    private String estado;
    private String cep;
    private String complemento;
    private String apelido;

    public static EnderecoClienteResponse from(EnderecoCliente e) {
        EnderecoClienteResponse r = new EnderecoClienteResponse();
        r.setId(e.getId());
        r.setRua(e.getRua());
        r.setNumero(e.getNumero());
        r.setBairro(e.getBairro());
        r.setCidade(e.getCidade());
        r.setEstado(e.getEstado());
        r.setCep(e.getCep());
        r.setComplemento(e.getComplemento());
        r.setApelido(e.getApelido());
        return r;
    }
}
