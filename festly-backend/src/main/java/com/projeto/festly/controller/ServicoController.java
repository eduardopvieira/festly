package com.projeto.festly.controller;

import com.projeto.festly.dto.ServicoRequest;
import com.projeto.festly.dto.ServicoResponse;
import com.projeto.festly.entity.CategoriaServico;
import com.projeto.festly.service.ServicoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/catalogo")
@RequiredArgsConstructor
public class ServicoController {

    private final ServicoService service;

    @PostMapping
    public ResponseEntity<ServicoResponse> criar(@Valid @RequestBody ServicoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(request));
    }

    @GetMapping
    public List<ServicoResponse> listar(
            @RequestParam(required = false) CategoriaServico categoria,
            @RequestParam(required = false) BigDecimal precoMax,
            @RequestParam(required = false) Boolean disponivel) {
        return service.listar(categoria, precoMax, disponivel);
    }

    @GetMapping("/{id}")
    public ServicoResponse buscarPorId(@PathVariable Long id) {
        return service.buscarPorId(id);
    }

    @GetMapping("/fornecedor/{fornecedorId}")
    public List<ServicoResponse> listarPorFornecedor(@PathVariable Long fornecedorId) {
        return service.listarPorFornecedor(fornecedorId);
    }

    @PutMapping("/{id}")
    public ServicoResponse atualizar(@PathVariable Long id, @Valid @RequestBody ServicoRequest request) {
        return service.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remover(@PathVariable Long id) {
        service.remover(id);
    }
}
