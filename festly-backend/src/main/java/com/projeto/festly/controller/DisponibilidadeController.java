package com.projeto.festly.controller;

import com.projeto.festly.dto.BlocoHorarioResponse;
import com.projeto.festly.dto.DisponibilidadeRequest;
import com.projeto.festly.dto.IntervaloAgendaResponse;
import com.projeto.festly.dto.RegraDisponibilidadeResponse;
import com.projeto.festly.service.DisponibilidadeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
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
    public ResponseEntity<List<RegraDisponibilidadeResponse>> definir(
            @PathVariable Long servicoId,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody @Valid DisponibilidadeRequest request
    ) {
        return ResponseEntity.ok(service.definirDisponibilidade(servicoId, userDetails.getUsername(), request));
    }

    @GetMapping("/servico/{servicoId}/regras")
    public ResponseEntity<List<RegraDisponibilidadeResponse>> listarRegras(@PathVariable Long servicoId) {
        return ResponseEntity.ok(service.listarRegras(servicoId));
    }

    /** Intervalos contínuos disponíveis (modelo preferencial). */
    @GetMapping("/servico/{servicoId}/intervalos")
    public ResponseEntity<List<IntervaloAgendaResponse>> listarIntervalos(
            @PathVariable Long servicoId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(service.gerarIntervalos(servicoId, inicio, fim, email));
    }

    /** Visão derivada em blocos de duração fixa. */
    @GetMapping("/servico/{servicoId}/blocos")
    public ResponseEntity<List<BlocoHorarioResponse>> listarBlocos(
            @PathVariable Long servicoId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim,
            @RequestParam(required = false) Integer duracaoMinutos,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(service.gerarBlocos(servicoId, inicio, fim, duracaoMinutos, email));
    }
}
