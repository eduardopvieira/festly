package com.projeto.festly.dto;

import com.projeto.festly.entity.Fornecedor;
import lombok.Data;

@Data
public class FornecedorResponse {

    private Long id;
    private String nome;
    private String email;
    private String telefone;
    private String cnpj;
    private String descricao;

    public static FornecedorResponse from(Fornecedor fornecedor) {
        FornecedorResponse response = new FornecedorResponse();
        response.setId(fornecedor.getId());
        response.setNome(fornecedor.getNome());
        response.setEmail(fornecedor.getEmail());
        response.setTelefone(fornecedor.getTelefone());
        response.setCnpj(fornecedor.getCnpj());
        response.setDescricao(fornecedor.getDescricao());
        return response;
    }
}
