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
            @RequestParam(required = false) CategoriaServico categoria,
            @RequestParam(required = false) BigDecimal precoMax,
            @RequestParam(required = false) Boolean disponivel) {
        return service.listar(categoria, precoMax, disponivel);
    }
}
