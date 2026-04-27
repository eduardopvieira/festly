package com.projeto.festly.dto;

import com.projeto.festly.entity.ItemCarrinho;
import lombok.Data;
import java.time.LocalDate;

@Data
public class ItemCarrinhoResponse {
    private Long id;
    private ServicoResponse servico;
    private LocalDate dataEvento;

    public static ItemCarrinhoResponse from(ItemCarrinho item) {
        ItemCarrinhoResponse response = new ItemCarrinhoResponse();
        response.setId(item.getId());
        response.setServico(ServicoResponse.from(item.getServico()));
        response.setDataEvento(item.getDataEvento());
        return response;
    }
}