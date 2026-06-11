package com.projeto.festly.dto;

import com.projeto.festly.entity.ItemCarrinho;
import com.projeto.festly.entity.TipoCobranca;
import lombok.Data;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;

@Data
public class ItemCarrinhoResponse {

    private Long id;
    private ServicoResponse servico;
    private LocalDateTime inicio;
    private LocalDateTime fim;
    private Integer numeroPessoas;
    private BigDecimal precoCalculado;
    private String rua;
    private String numero;
    private String bairro;
    private String cidade;
    private String estado;
    private String cep;
    private String complemento;
    private String tipoEvento;
    private String observacoes;

    public static ItemCarrinhoResponse from(ItemCarrinho item) {
        ItemCarrinhoResponse response = new ItemCarrinhoResponse();
        response.setId(item.getId());
        response.setServico(ServicoResponse.from(item.getServico()));
        response.setInicio(item.getInicio());
        response.setFim(item.getFim());
        response.setNumeroPessoas(item.getNumeroPessoas());
        response.setPrecoCalculado(calcularPreco(item));
        response.setRua(item.getRua());
        response.setNumero(item.getNumero());
        response.setBairro(item.getBairro());
        response.setCidade(item.getCidade());
        response.setEstado(item.getEstado());
        response.setCep(item.getCep());
        response.setComplemento(item.getComplemento());
        response.setTipoEvento(item.getTipoEvento());
        response.setObservacoes(item.getObservacoes());
        return response;
    }

    private static BigDecimal calcularPreco(ItemCarrinho item) {
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
