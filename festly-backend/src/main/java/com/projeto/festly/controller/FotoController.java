package com.projeto.festly.controller;

import com.projeto.festly.dto.ServicoFotoResponse;
import com.projeto.festly.service.FotoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/catalogo")
@RequiredArgsConstructor
public class FotoController {

    private final FotoService fotoService;

    @PostMapping("/{id}/fotos")
    public ResponseEntity<ServicoFotoResponse> upload(
            @PathVariable Long id,
            @RequestParam("arquivo") MultipartFile arquivo) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED).body(fotoService.upload(id, arquivo));
    }

    @DeleteMapping("/{id}/fotos/{fotoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletar(@PathVariable Long id, @PathVariable Long fotoId) throws IOException {
        fotoService.deletar(id, fotoId);
    }
}
