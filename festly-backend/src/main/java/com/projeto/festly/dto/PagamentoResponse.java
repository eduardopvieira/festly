package com.projeto.festly.dto;

import com.projeto.festly.entity.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PagamentoResponse(
    Long id,
    StatusPagamento status,
    MetodoPagamento metodo,
    BigDecimal valorTotal,
    LocalDateTime expiresAt,
    LocalDateTime createdAt,
    PixInfoResponse pix,
    List<ItemPagamentoResponse> itens
) {
    public static PagamentoResponse from(Pagamento p) {
        PixInfoResponse pix = (p.getPixQrCode() != null)
            ? new PixInfoResponse(p.getPixQrCode(), p.getPixQrCodeImage())
            : null;
        return new PagamentoResponse(
            p.getId(), p.getStatus(), p.getMetodo(), p.getValorTotal(),
            p.getExpiresAt(), p.getCreatedAt(),
            pix,
            p.getItens().stream().map(ItemPagamentoResponse::from).toList()
        );
    }
}
