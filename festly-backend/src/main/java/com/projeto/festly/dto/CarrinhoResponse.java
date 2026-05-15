package com.projeto.festly.dto;

import com.projeto.festly.entity.Carrinho;
import com.projeto.festly.entity.ItemCarrinho;
import com.projeto.festly.entity.TipoCobranca;
import lombok.Data;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
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
                        .map(CarrinhoResponse::calcularPrecoItem)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
        );

        return response;
    }

    private static BigDecimal calcularPrecoItem(ItemCarrinho item) {
        BigDecimal preco = item.getServico().getPreco();
        TipoCobranca tipo = item.getServico().getTipoCobranca();
        if (tipo == null) return preco;

        return switch (tipo) {
            case POR_HORA -> {
                long minutos = Duration.between(item.getInicio(), item.getFim()).toMinutes();
                BigDecimal horas = BigDecimal.valueOf(minutos)
                        .divide(BigDecimal.valueOf(60), 4, RoundingMode.HALF_UP);
                yield preco.multiply(horas).setScale(2, RoundingMode.HALF_UP);
            }
            case POR_PESSOA -> {
                int pessoas = item.getNumeroPessoas() != null ? item.getNumeroPessoas() : 1;
                yield preco.multiply(BigDecimal.valueOf(pessoas));
            }
            case POR_EVENTO -> preco;
        };
    }
}
