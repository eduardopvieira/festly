package com.projeto.festly.controller;

import com.projeto.festly.dto.BlocoHorarioResponse;
import com.projeto.festly.dto.DisponibilidadeSemanalRequest;
import com.projeto.festly.dto.DisponibilidadeSemanalResponse;
import com.projeto.festly.service.DisponibilidadeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/disponibilidades")
@RequiredArgsConstructor
public class DisponibilidadeController {

    private final DisponibilidadeService service;

    @PutMapping("/servico/{servicoId}")
    @PreAuthorize("hasRole('PRESTADOR')")
    public ResponseEntity<List<DisponibilidadeSemanalResponse>> definirDisponibilidade(
            @PathVariable Long servicoId,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody @Valid DisponibilidadeSemanalRequest request
    ) {
        return ResponseEntity.ok(service.definirDisponibilidade(servicoId, userDetails.getUsername(), request));
    }

    @GetMapping("/servico/{servicoId}/regras")
    public ResponseEntity<List<DisponibilidadeSemanalResponse>> listarRegras(@PathVariable Long servicoId) {
        return ResponseEntity.ok(service.listarRegras(servicoId));
    }

    @GetMapping("/servico/{servicoId}/blocos")
    public ResponseEntity<List<BlocoHorarioResponse>> listarBlocos(
            @PathVariable Long servicoId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim
    ) {
        return ResponseEntity.ok(service.gerarBlocos(servicoId, inicio, fim));
    }
}
