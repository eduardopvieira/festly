package com.projeto.festly.controller;

import com.projeto.festly.dto.AgendamentoRequest;
import com.projeto.festly.dto.AgendamentoResponse;
import com.projeto.festly.entity.Usuario;
import com.projeto.festly.service.AgendamentoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.util.List;

@RestController
@RequestMapping("/agendamentos")
@RequiredArgsConstructor
public class AgendamentoController {

    private final AgendamentoService service;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AgendamentoResponse> agendar(@RequestBody @Valid AgendamentoRequest request) {
        AgendamentoResponse response = service.agendar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/cliente/{clienteId}")
    @PreAuthorize("isAuthenticated()")
    public Page<AgendamentoResponse> listarDoCliente(
            @PathVariable Long clienteId,
            @RequestParam(defaultValue = "true") boolean ativo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return service.listarDoCliente(clienteId, ativo, PageRequest.of(page, size));
    }

    @PostMapping("/{agendamentoId}/cancelar")
    @PreAuthorize("isAuthenticated()")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelar(@PathVariable Long agendamentoId, @RequestParam Long clienteId) {
        service.cancelar(agendamentoId, clienteId);
    }

    @GetMapping("/prestador")
    @PreAuthorize("isAuthenticated()")
    public Page<AgendamentoResponse> listarDoPrestador(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam(defaultValue = "true") boolean pendente,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return service.listarDoPrestador(usuario.getId(), pendente, PageRequest.of(page, size));
    }

    @PostMapping("/{id}/confirmar")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AgendamentoResponse> confirmar(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(service.confirmar(id, usuario.getId()));
    }

    @PostMapping("/{id}/rejeitar")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AgendamentoResponse> rejeitar(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(service.rejeitar(id, usuario.getId()));
    }
}
