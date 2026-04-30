package com.projeto.festly.controller;

import com.projeto.festly.dto.AgendamentoRequest;
import com.projeto.festly.dto.AgendamentoResponse;
import com.projeto.festly.service.AgendamentoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    @GetMapping("/servico/{servicoId}/ocupados")
    public ResponseEntity<List<String>> listarDatasOcupadas(@PathVariable Long servicoId) {
        return ResponseEntity.ok(service.buscarDatasOcupadas(servicoId));
    }
}
