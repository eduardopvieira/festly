package com.projeto.festly.dto;

import com.projeto.festly.entity.ItemCarrinho;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ItemCarrinhoResponse {

    private Long id;
    private ServicoResponse servico;
    private LocalDateTime inicio;
    private LocalDateTime fim;

    public static ItemCarrinhoResponse from(ItemCarrinho item) {
        ItemCarrinhoResponse response = new ItemCarrinhoResponse();
        response.setId(item.getId());
        response.setServico(ServicoResponse.from(item.getServico()));
        response.setInicio(item.getInicio());
        response.setFim(item.getFim());
        return response;
    }
}
