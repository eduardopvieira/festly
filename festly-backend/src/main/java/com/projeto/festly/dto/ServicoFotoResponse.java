package com.projeto.festly.dto;

import com.projeto.festly.entity.ServicoFoto;

public record ServicoFotoResponse(Long id, String url, Integer ordem) {
    public static ServicoFotoResponse from(ServicoFoto foto) {
        return new ServicoFotoResponse(foto.getId(), foto.getUrl(), foto.getOrdem());
    }
}
