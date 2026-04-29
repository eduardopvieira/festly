package com.projeto.festly.controller;

import com.projeto.festly.dto.CarrinhoResponse;
import com.projeto.festly.dto.ItemCarrinhoRequest;
import com.projeto.festly.service.CarrinhoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;

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
    public CarrinhoResponse adicionarServico(@PathVariable Long usuarioId,
                                             @PathVariable Long servicoId,
                                             @Valid @RequestBody ItemCarrinhoRequest request) {
        return service.adicionarServico(usuarioId, servicoId, request.getDataEvento(), request.getHorarioEvento());
    }

    @DeleteMapping("/{usuarioId}/servicos/{servicoId}")
    public CarrinhoResponse removerServico(@PathVariable Long usuarioId,
                                           @PathVariable Long servicoId) {
        return service.removerServico(usuarioId, servicoId);
    }

    @DeleteMapping("/{usuarioId}/servicos/{servicoId}/slot")
    public CarrinhoResponse removerSlot(
            @PathVariable Long usuarioId,
            @PathVariable Long servicoId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataEvento,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime horarioEvento
    ) {
        return service.removerSlot(usuarioId, servicoId, dataEvento, horarioEvento);
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
