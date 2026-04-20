package com.projeto.festly.service;

import com.projeto.festly.dto.CarrinhoResponse;
import com.projeto.festly.entity.Carrinho;
import com.projeto.festly.entity.Servico;
import com.projeto.festly.entity.Usuario;
import com.projeto.festly.repository.CarrinhoRepository;
import com.projeto.festly.repository.ServicoRepository;
import com.projeto.festly.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CarrinhoService {

    private final CarrinhoRepository carrinhoRepository;
    private final ServicoRepository servicoRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public CarrinhoResponse buscar(Long usuarioId) {
        Carrinho carrinho = buscarOuCriar(usuarioId);
        return CarrinhoResponse.from(carrinho);
    }

    @Transactional
    public CarrinhoResponse adicionarServico(Long usuarioId, Long servicoId) {
        Carrinho carrinho = buscarOuCriar(usuarioId);
        Servico servico = servicoRepository.findById(servicoId)
                .orElseThrow(() -> new EntityNotFoundException("Serviço não encontrado: " + servicoId));

        boolean jaExiste = carrinho.getServicos().stream()
                .anyMatch(s -> s.getId().equals(servicoId));
        if (jaExiste) {
            throw new IllegalStateException("Serviço já está no carrinho");
        }

        carrinho.getServicos().add(servico);
        carrinhoRepository.save(carrinho);
        return CarrinhoResponse.from(carrinho);
    }

    @Transactional
    public CarrinhoResponse removerServico(Long usuarioId, Long servicoId) {
        Carrinho carrinho = buscarOuCriar(usuarioId);

        boolean removido = carrinho.getServicos().removeIf(s -> s.getId().equals(servicoId));
        if (!removido) {
            throw new EntityNotFoundException("Serviço não encontrado no carrinho: " + servicoId);
        }

        carrinhoRepository.save(carrinho);
        return CarrinhoResponse.from(carrinho);
    }

    @Transactional
    public void limpar(Long usuarioId) {
        Carrinho carrinho = buscarOuCriar(usuarioId);
        carrinho.getServicos().clear();
        carrinhoRepository.save(carrinho);
    }

    private Carrinho buscarOuCriar(Long usuarioId) {
        return carrinhoRepository.findByUsuarioId(usuarioId)
                .orElseGet(() -> {
                    Usuario usuario = usuarioRepository.findById(usuarioId)
                            .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado: " + usuarioId));
                    Carrinho novo = Carrinho.builder()
                            .usuario(usuario)
                            .build();
                    return carrinhoRepository.save(novo);
                });
    }
}
