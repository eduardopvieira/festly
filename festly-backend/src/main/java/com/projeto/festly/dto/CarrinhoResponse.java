package com.projeto.festly.dto;

import com.projeto.festly.entity.Carrinho;
import com.projeto.festly.entity.Servico;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CarrinhoResponse {

    private Long id;
    private Long usuarioId;
    private List<ServicoResponse> servicos;
    private BigDecimal valorTotal;

    public static CarrinhoResponse from(Carrinho carrinho) {
        CarrinhoResponse response = new CarrinhoResponse();
        response.setId(carrinho.getId());
        response.setUsuarioId(carrinho.getUsuario().getId());
        response.setServicos(
                carrinho.getServicos().stream()
                        .map(ServicoResponse::from)
                        .toList()
        );
        response.setValorTotal(
                carrinho.getServicos().stream()
                        .map(Servico::getPreco)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
        );
        return response;
    }
}
