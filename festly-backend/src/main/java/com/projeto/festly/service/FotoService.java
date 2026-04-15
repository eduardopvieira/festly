package com.projeto.festly.service;

import com.projeto.festly.dto.ServicoFotoResponse;
import com.projeto.festly.entity.Servico;
import com.projeto.festly.entity.ServicoFoto;
import com.projeto.festly.repository.ServicoFotoRepository;
import com.projeto.festly.repository.ServicoRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FotoService {

    private static final int MAX_FOTOS = 5;
    private static final String UPLOAD_DIR = "uploads/servicos/";

    private final ServicoRepository servicoRepository;
    private final ServicoFotoRepository fotoRepository;

    public ServicoFotoResponse upload(Long servicoId, MultipartFile arquivo) throws IOException {
        Servico servico = servicoRepository.findById(servicoId)
                .orElseThrow(() -> new EntityNotFoundException("Serviço não encontrado: " + servicoId));

        long count = fotoRepository.countByServico_Id(servicoId);
        if (count >= MAX_FOTOS) {
            throw new IllegalStateException("Limite de " + MAX_FOTOS + " fotos atingido.");
        }

        Path dir = Paths.get(UPLOAD_DIR);
        Files.createDirectories(dir);

        String ext = StringUtils.getFilenameExtension(arquivo.getOriginalFilename());
        String filename = UUID.randomUUID() + (ext != null ? "." + ext : "");
        arquivo.transferTo(dir.resolve(filename));

        String url = "/uploads/servicos/" + filename;
        ServicoFoto foto = ServicoFoto.builder()
                .servico(servico)
                .url(url)
                .ordem((int) count)
                .build();

        return ServicoFotoResponse.from(fotoRepository.save(foto));
    }

    public void deletar(Long servicoId, Long fotoId) throws IOException {
        ServicoFoto foto = fotoRepository.findById(fotoId)
                .orElseThrow(() -> new EntityNotFoundException("Foto não encontrada: " + fotoId));

        if (!foto.getServico().getId().equals(servicoId)) {
            throw new IllegalArgumentException("Foto não pertence ao serviço informado.");
        }

        String filename = Paths.get(foto.getUrl()).getFileName().toString();
        Files.deleteIfExists(Paths.get(UPLOAD_DIR, filename));
        fotoRepository.delete(foto);
    }
}
