package com.projeto.festly.controller;

import com.projeto.festly.dto.CarrinhoResponse;
import com.projeto.festly.service.CarrinhoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

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
                                             @PathVariable Long servicoId) {
        return service.adicionarServico(usuarioId, servicoId);
    }

    @DeleteMapping("/{usuarioId}/servicos/{servicoId}")
    public CarrinhoResponse removerServico(@PathVariable Long usuarioId,
                                           @PathVariable Long servicoId) {
        return service.removerServico(usuarioId, servicoId);
    }

    @DeleteMapping("/{usuarioId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void limpar(@PathVariable Long usuarioId) {
        service.limpar(usuarioId);
    }
}
