package com.projeto.festly.controller;

import com.projeto.festly.dto.AvaliacaoRequest;
import com.projeto.festly.dto.AvaliacaoResponse;
import com.projeto.festly.entity.Usuario;
import com.projeto.festly.service.AvaliacaoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/avaliacoes")
@RequiredArgsConstructor
public class AvaliacaoController {

    private final AvaliacaoService service;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AvaliacaoResponse> criar(
            @RequestBody @Valid AvaliacaoRequest request,
            @AuthenticationPrincipal Usuario usuario) {
        AvaliacaoResponse response = service.criar(request, usuario.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/agendamento/{agendamentoId}")
    @PreAuthorize("isAuthenticated()")
    public AvaliacaoResponse buscarPorAgendamento(
            @PathVariable Long agendamentoId,
            @AuthenticationPrincipal Usuario usuario) {
        return service.buscarPorAgendamento(agendamentoId, usuario.getId());
    }

    @GetMapping("/servico/{servicoId}")
    @PreAuthorize("isAuthenticated()")
    public Page<AvaliacaoResponse> listarPorServico(
            @PathVariable Long servicoId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal Usuario usuario) {
        return service.listarPorServico(servicoId, usuario.getId(), PageRequest.of(page, size));
    }
}
