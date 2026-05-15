package com.projeto.festly.controller;

import com.projeto.festly.dto.ServicoResponse;
import com.projeto.festly.entity.CategoriaServico;
import com.projeto.festly.service.ServicoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/public/catalogo")
@RequiredArgsConstructor
public class PublicCatalogoController {

    private final ServicoService service;

    @GetMapping
    public Page<ServicoResponse> listar(
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) CategoriaServico categoria,
            @RequestParam(required = false) String cidade,
            @RequestParam(required = false) BigDecimal precoMax,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {

        return service.listar(nome, categoria, cidade, precoMax, null, PageRequest.of(page, size));
    }
}
