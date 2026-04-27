package com.projeto.festly.dto;

import com.projeto.festly.entity.Carrinho;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class CarrinhoResponse {
    private Long id;
    private Long usuarioId;
    private List<ItemCarrinhoResponse> itens;
    private BigDecimal valorTotal;

    public static CarrinhoResponse from(Carrinho carrinho) {
        CarrinhoResponse response = new CarrinhoResponse();
        response.setId(carrinho.getId());
        response.setUsuarioId(carrinho.getUsuario().getId());

        response.setItens(
                carrinho.getItens().stream()
                        .map(ItemCarrinhoResponse::from)
                        .toList()
        );

        response.setValorTotal(
                carrinho.getItens().stream()
                        .map(item -> item.getServico().getPreco())
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
        );

        return response;
    }
}