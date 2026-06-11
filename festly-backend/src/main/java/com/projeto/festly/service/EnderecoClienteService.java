package com.projeto.festly.service;

import com.projeto.festly.dto.EnderecoClienteRequest;
import com.projeto.festly.dto.EnderecoClienteResponse;
import com.projeto.festly.entity.EnderecoCliente;
import com.projeto.festly.entity.Usuario;
import com.projeto.festly.repository.EnderecoClienteRepository;
import com.projeto.festly.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EnderecoClienteService {

    private final EnderecoClienteRepository repository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<EnderecoClienteResponse> listar(Long usuarioId) {
        return repository.findByUsuarioId(usuarioId)
                .stream()
                .map(EnderecoClienteResponse::from)
                .toList();
    }

    @Transactional
    public EnderecoClienteResponse salvar(Long usuarioId, EnderecoClienteRequest request) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado: " + usuarioId));

        EnderecoCliente endereco = EnderecoCliente.builder()
                .usuario(usuario)
                .rua(request.getRua())
                .numero(request.getNumero())
                .bairro(request.getBairro())
                .cidade(request.getCidade())
                .estado(request.getEstado())
                .cep(request.getCep())
                .complemento(request.getComplemento())
                .apelido(request.getApelido())
                .build();

        return EnderecoClienteResponse.from(repository.save(endereco));
    }

    @Transactional
    public void remover(Long usuarioId, Long enderecoId) {
        EnderecoCliente endereco = repository.findById(enderecoId)
                .orElseThrow(() -> new EntityNotFoundException("Endereço não encontrado: " + enderecoId));
        if (!endereco.getUsuario().getId().equals(usuarioId)) {
            throw new IllegalStateException("Endereço não pertence a este usuário.");
        }
        repository.delete(endereco);
    }
}
