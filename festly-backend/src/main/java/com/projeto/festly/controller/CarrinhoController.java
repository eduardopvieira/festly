package com.projeto.festly.controller;

import com.projeto.festly.dto.CarrinhoResponse;
import com.projeto.festly.dto.ItemCarrinhoRequest;
import com.projeto.festly.service.CarrinhoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/carrinho")
@RequiredArgsConstructor
public class CarrinhoController {

    private final CarrinhoService service;

    @GetMapping("/{usuarioId}")
    public CarrinhoResponse buscar(@PathVariable Long usuarioId) {
        return service.buscar(usuarioId);
    }

    @PostMapping("/{usuarioId}/servicos/{servicoId}")
    public CarrinhoResponse adicionarServico(
            @PathVariable Long usuarioId,
            @PathVariable Long servicoId,
            @Valid @RequestBody ItemCarrinhoRequest request
    ) {
        return service.adicionarServico(usuarioId, servicoId, request.getInicio(), request.getFim());
    }

    @DeleteMapping("/{usuarioId}/itens/{itemId}")
    public CarrinhoResponse removerItem(
            @PathVariable Long usuarioId,
            @PathVariable Long itemId
    ) {
        return service.removerItem(usuarioId, itemId);
    }

    @DeleteMapping("/{usuarioId}/servicos/{servicoId}/slot")
    public CarrinhoResponse removerSlot(
            @PathVariable Long usuarioId,
            @PathVariable Long servicoId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fim
    ) {
        return service.removerSlot(usuarioId, servicoId, inicio, fim);
    }

    @DeleteMapping("/{usuarioId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void limpar(@PathVariable Long usuarioId) {
        service.limpar(usuarioId);
    }

    @PostMapping("/{usuarioId}/checkout")
    @ResponseStatus(HttpStatus.OK)
    public void finalizarCompra(@PathVariable Long usuarioId) {
        service.finalizarCompra(usuarioId);
    }
}
