package com.projeto.festly.service;

import com.projeto.festly.dto.CarrinhoResponse;
import com.projeto.festly.entity.*;
import com.projeto.festly.repository.AgendamentoRepository;
import com.projeto.festly.repository.CarrinhoRepository;
import com.projeto.festly.repository.ItemCarrinhoRepository;
import com.projeto.festly.repository.ServicoRepository;
import com.projeto.festly.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CarrinhoService {

    private final CarrinhoRepository carrinhoRepository;
    private final ServicoRepository servicoRepository;
    private final UsuarioRepository usuarioRepository;
    private final AgendamentoRepository agendamentoRepository;
    private final ItemCarrinhoRepository itemCarrinhoRepository;
    private final DisponibilidadeService disponibilidadeService;

    @Transactional(readOnly = true)
    public CarrinhoResponse buscar(Long usuarioId) {
        Carrinho carrinho = buscarOuCriar(usuarioId);
        return CarrinhoResponse.from(carrinho);
    }

    @Transactional
    public CarrinhoResponse adicionarServico(
            Long usuarioId,
            Long servicoId,
            LocalDateTime inicio,
            LocalDateTime fim
    ) {
        AgendamentoService.validarIntervalo(inicio, fim);

        Carrinho carrinho = buscarOuCriar(usuarioId);
        Servico servico = servicoRepository.findById(servicoId)
                .orElseThrow(() -> new EntityNotFoundException("Serviço não encontrado: " + servicoId));

        if (!disponibilidadeService.intervaloDentroDaAgenda(servicoId, inicio, fim)) {
            throw new IllegalStateException("Este horário está fora da agenda do prestador.");
        }

        if (agendamentoRepository.existsConflict(servicoId, inicio, fim, StatusAgendamento.CANCELADO)) {
            throw new IllegalStateException("Este horário já foi reservado.");
        }

        if (itemCarrinhoRepository.existsConflictExceptUser(servicoId, inicio, fim, usuarioId)) {
            throw new IllegalStateException("Este horário já está no carrinho de outro cliente.");
        }

        boolean jaNoMeuCarrinho = carrinho.getItens().stream()
                .anyMatch(it -> it.getServico().getId().equals(servicoId)
                        && it.getInicio().equals(inicio)
                        && it.getFim().equals(fim));
        if (jaNoMeuCarrinho) {
            throw new IllegalStateException("Este horário já está no seu carrinho.");
        }

        ItemCarrinho novo = ItemCarrinho.builder()
                .carrinho(carrinho)
                .servico(servico)
                .inicio(inicio)
                .fim(fim)
                .build();

        carrinho.getItens().add(novo);
        try {
            carrinhoRepository.saveAndFlush(carrinho);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalStateException("Este horário já está no seu carrinho.");
        }

        return CarrinhoResponse.from(carrinho);
    }

    @Transactional
    public CarrinhoResponse removerItem(Long usuarioId, Long itemId) {
        Carrinho carrinho = buscarOuCriar(usuarioId);
        boolean removido = carrinho.getItens().removeIf(item -> item.getId().equals(itemId));
        if (!removido) {
            throw new EntityNotFoundException("Item não encontrado no carrinho.");
        }
        carrinhoRepository.save(carrinho);
        return CarrinhoResponse.from(carrinho);
    }

    @Transactional
    public CarrinhoResponse removerSlot(
            Long usuarioId,
            Long servicoId,
            LocalDateTime inicio,
            LocalDateTime fim
    ) {
        Carrinho carrinho = buscarOuCriar(usuarioId);
        boolean removido = carrinho.getItens().removeIf(item ->
                item.getServico().getId().equals(servicoId)
                        && item.getInicio().equals(inicio)
                        && item.getFim().equals(fim));
        if (!removido) {
            throw new EntityNotFoundException("Slot não encontrado no carrinho.");
        }
        carrinhoRepository.save(carrinho);
        return CarrinhoResponse.from(carrinho);
    }

    @Transactional
    public void limpar(Long usuarioId) {
        Carrinho carrinho = buscarOuCriar(usuarioId);
        carrinho.getItens().clear();
        carrinhoRepository.save(carrinho);
    }

    @Transactional
    public void finalizarCompra(Long usuarioId) {
        Carrinho carrinho = buscarOuCriar(usuarioId);
        if (carrinho.getItens().isEmpty()) {
            throw new IllegalStateException("Seu carrinho está vazio.");
        }

        for (ItemCarrinho item : carrinho.getItens()) {
            if (agendamentoRepository.existsConflict(
                    item.getServico().getId(),
                    item.getInicio(),
                    item.getFim(),
                    StatusAgendamento.CANCELADO
            )) {
                throw new IllegalStateException(
                        "O serviço '" + item.getServico().getNome() +
                                "' acabou de ser reservado por outra pessoa para " +
                                item.getInicio() + ". Remova-o do carrinho para continuar.");
            }
        }

        for (ItemCarrinho item : carrinho.getItens()) {
            Agendamento novo = Agendamento.builder()
                    .servico(item.getServico())
                    .cliente(carrinho.getUsuario())
                    .inicio(item.getInicio())
                    .fim(item.getFim())
                    .status(StatusAgendamento.CONFIRMADO)
                    .build();
            try {
                agendamentoRepository.saveAndFlush(novo);
            } catch (DataIntegrityViolationException ex) {
                throw new IllegalStateException(
                        "O serviço '" + item.getServico().getNome() +
                                "' acabou de ser reservado por outra pessoa.");
            }
        }

        carrinho.getItens().clear();
        carrinhoRepository.save(carrinho);
    }

    private Carrinho buscarOuCriar(Long usuarioId) {
        return carrinhoRepository.findByUsuarioId(usuarioId)
                .orElseGet(() -> {
                    Usuario usuario = usuarioRepository.findById(usuarioId)
                            .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado: " + usuarioId));
                    Carrinho novo = Carrinho.builder().usuario(usuario).build();
                    return carrinhoRepository.save(novo);
                });
    }
}
