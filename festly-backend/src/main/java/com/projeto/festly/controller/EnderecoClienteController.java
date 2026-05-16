package com.projeto.festly.controller;

import com.projeto.festly.dto.EnderecoClienteRequest;
import com.projeto.festly.dto.EnderecoClienteResponse;
import com.projeto.festly.service.EnderecoClienteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/clientes/{usuarioId}/enderecos")
@RequiredArgsConstructor
public class EnderecoClienteController {

    private final EnderecoClienteService service;

    @GetMapping
    public List<EnderecoClienteResponse> listar(@PathVariable Long usuarioId) {
        return service.listar(usuarioId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EnderecoClienteResponse salvar(
            @PathVariable Long usuarioId,
            @Valid @RequestBody EnderecoClienteRequest request
    ) {
        return service.salvar(usuarioId, request);
    }

    @DeleteMapping("/{enderecoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remover(
            @PathVariable Long usuarioId,
            @PathVariable Long enderecoId
    ) {
        service.remover(usuarioId, enderecoId);
    }
}
