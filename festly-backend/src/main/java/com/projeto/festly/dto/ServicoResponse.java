package com.projeto.festly.dto;

import com.projeto.festly.entity.CategoriaServico;
import com.projeto.festly.entity.Servico;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ServicoResponse {

    private Long id;
    private String nome;
    private String descricao;
    private BigDecimal preco;
    private CategoriaServico categoria;
    private boolean disponivel;
    private Long fornecedorId;

    public static ServicoResponse from(Servico servico) {
        ServicoResponse response = new ServicoResponse();
        response.setId(servico.getId());
        response.setNome(servico.getNome());
        response.setDescricao(servico.getDescricao());
        response.setPreco(servico.getPreco());
        response.setCategoria(servico.getCategoria());
        response.setDisponivel(servico.isDisponivel());
        response.setFornecedorId(servico.getFornecedor().getId());
        return response;
    }
}
