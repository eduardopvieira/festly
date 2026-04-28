package com.projeto.festly.controller;

import com.projeto.festly.dto.ServicoResponse;
import com.projeto.festly.entity.CategoriaServico;
import com.projeto.festly.service.ServicoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/public/catalogo")
@RequiredArgsConstructor
public class PublicCatalogoController {

    private final ServicoService service;

    @GetMapping
    public List<ServicoResponse> listar(
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) CategoriaServico categoria,
            @RequestParam(required = false) String cidade,
            @RequestParam(required = false) BigDecimal precoMax) {

        return service.listar(nome, categoria, cidade, precoMax);
    }
}
