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

import java.util.List;

@RestController
@RequestMapping("/agendamentos")
@RequiredArgsConstructor
public class AgendamentoController {

    private final AgendamentoService service;

    @PostMapping
    @PreAuthorize("hasRole('CLIENTE')")
    public ResponseEntity<AgendamentoResponse> agendar(@RequestBody @Valid AgendamentoRequest request) {
        AgendamentoResponse response = service.agendar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<AgendamentoResponse>> listarDoCliente(@PathVariable Long clienteId) {
        return ResponseEntity.ok(service.listarDoCliente(clienteId));
    }

    @PostMapping("/{agendamentoId}/cancelar")
    @PreAuthorize("hasRole('CLIENTE')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelar(@PathVariable Long agendamentoId, @RequestParam Long clienteId) {
        service.cancelar(agendamentoId, clienteId);
    }

    @GetMapping("/prestador")
    @PreAuthorize("hasRole('PRESTADOR')")
    public ResponseEntity<List<AgendamentoResponse>> listarDoPrestador(
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(service.listarDoPrestador(usuario.getId()));
    }

    @PostMapping("/{id}/confirmar")
    @PreAuthorize("hasRole('PRESTADOR')")
    public ResponseEntity<AgendamentoResponse> confirmar(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(service.confirmar(id, usuario.getId()));
    }

    @PostMapping("/{id}/rejeitar")
    @PreAuthorize("hasRole('PRESTADOR')")
    public ResponseEntity<AgendamentoResponse> rejeitar(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(service.rejeitar(id, usuario.getId()));
    }
}
