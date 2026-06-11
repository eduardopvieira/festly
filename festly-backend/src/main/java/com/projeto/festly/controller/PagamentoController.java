package com.projeto.festly.controller;

import com.projeto.festly.dto.CheckoutRequest;
import com.projeto.festly.dto.PagamentoResponse;
import com.projeto.festly.entity.Usuario;
import com.projeto.festly.service.CheckoutService;
import com.projeto.festly.service.PagamentoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/pagamentos")
@RequiredArgsConstructor
public class PagamentoController {

    private final CheckoutService checkoutService;
    private final PagamentoService pagamentoService;

    @PostMapping("/checkout")
    @PreAuthorize("isAuthenticated()")
    public PagamentoResponse checkout(
            @AuthenticationPrincipal Usuario cliente,
            @Valid @RequestBody CheckoutRequest req) {
        return checkoutService.checkout(cliente.getId(), req);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public PagamentoResponse buscar(
            @AuthenticationPrincipal Usuario cliente,
            @PathVariable Long id) {
        return pagamentoService.buscar(id, cliente.getId());
    }

    @GetMapping("/meus")
    @PreAuthorize("isAuthenticated()")
    public Page<PagamentoResponse> listarMeus(
            @AuthenticationPrincipal Usuario cliente,
            Pageable pageable) {
        return pagamentoService.listarMeus(cliente.getId(), pageable);
    }
}
