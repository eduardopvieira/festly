package com.projeto.festly.service;

import com.projeto.festly.dto.CarrinhoResponse;
import com.projeto.festly.entity.*;
import com.projeto.festly.repository.AgendamentoRepository;
import com.projeto.festly.repository.CarrinhoRepository;
import com.projeto.festly.repository.ServicoRepository;
import com.projeto.festly.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class CarrinhoService {

    private final CarrinhoRepository carrinhoRepository;
    private final ServicoRepository servicoRepository;
    private final UsuarioRepository usuarioRepository;
    private final AgendamentoRepository agendamentoRepository;

    @Transactional(readOnly = true)
    public CarrinhoResponse buscar(Long usuarioId) {
        Carrinho carrinho = buscarOuCriar(usuarioId);
        return CarrinhoResponse.from(carrinho);
    }

    @Transactional
    public CarrinhoResponse adicionarServico(Long usuarioId, Long servicoId, LocalDate dataEvento, LocalTime horarioEvento) {
        Carrinho carrinho = buscarOuCriar(usuarioId);
        Servico servico = servicoRepository.findById(servicoId)
                .orElseThrow(() -> new EntityNotFoundException("Serviço não encontrado: " + servicoId));

        if (horarioEvento != null) {
            boolean reservadoPorOutro = agendamentoRepository
                    .existsByServicoIdAndDataEventoAndHorarioEventoAndStatusNot(
                            servicoId, dataEvento, horarioEvento, StatusAgendamento.CANCELADO);
            if (reservadoPorOutro) {
                throw new IllegalStateException("Este horário já foi reservado.");
            }
        }

        boolean jaExiste = carrinho.getItens().stream()
                .anyMatch(item -> item.getServico().getId().equals(servicoId)
                        && item.getDataEvento().equals(dataEvento)
                        && Objects.equals(item.getHorarioEvento(), horarioEvento));
        if (jaExiste) {
            throw new IllegalStateException("Este horário já está no seu carrinho.");
        }

        ItemCarrinho novoItem = ItemCarrinho.builder()
                .carrinho(carrinho)
                .servico(servico)
                .dataEvento(dataEvento)
                .horarioEvento(horarioEvento)
                .build();

        carrinho.getItens().add(novoItem);
        carrinhoRepository.save(carrinho);

        return CarrinhoResponse.from(carrinho);
    }

    @Transactional
    public CarrinhoResponse removerServico(Long usuarioId, Long servicoId) {
        Carrinho carrinho = buscarOuCriar(usuarioId);
        boolean removido = carrinho.getItens().removeIf(item -> item.getServico().getId().equals(servicoId));
        if (!removido) {
            throw new EntityNotFoundException("Serviço não encontrado no carrinho: " + servicoId);
        }
        carrinhoRepository.save(carrinho);
        return CarrinhoResponse.from(carrinho);
    }

    @Transactional
    public CarrinhoResponse removerSlot(Long usuarioId, Long servicoId, LocalDate dataEvento, LocalTime horarioEvento) {
        Carrinho carrinho = buscarOuCriar(usuarioId);
        boolean removido = carrinho.getItens().removeIf(item ->
                item.getServico().getId().equals(servicoId)
                        && item.getDataEvento().equals(dataEvento)
                        && Objects.equals(item.getHorarioEvento(), horarioEvento));
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

    @Transactional
    public void finalizarCompra(Long usuarioId) {
        Carrinho carrinho = buscarOuCriar(usuarioId);

        if (carrinho.getItens().isEmpty()) {
            throw new IllegalStateException("Seu carrinho está vazio.");
        }

        for (ItemCarrinho item : carrinho.getItens()) {
            boolean conflito;
            if (item.getHorarioEvento() != null) {
                conflito = agendamentoRepository.existsByServicoIdAndDataEventoAndHorarioEventoAndStatusNot(
                        item.getServico().getId(),
                        item.getDataEvento(),
                        item.getHorarioEvento(),
                        StatusAgendamento.CANCELADO
                );
            } else {
                conflito = agendamentoRepository.existsByServicoIdAndDataEventoAndStatusNot(
                        item.getServico().getId(),
                        item.getDataEvento(),
                        StatusAgendamento.CANCELADO
                );
            }

            if (conflito) {
                throw new IllegalStateException(
                        "O serviço '" + item.getServico().getNome() +
                                "' acabou de ser reservado por outra pessoa para " +
                                item.getDataEvento() +
                                (item.getHorarioEvento() != null ? " às " + item.getHorarioEvento() : "") +
                                ". Remova-o do carrinho para continuar."
                );
            }
        }

        for (ItemCarrinho item : carrinho.getItens()) {
            Agendamento novoAgendamento = Agendamento.builder()
                    .servico(item.getServico())
                    .cliente(carrinho.getUsuario())
                    .dataEvento(item.getDataEvento())
                    .horarioEvento(item.getHorarioEvento())
                    .status(StatusAgendamento.CONFIRMADO)
                    .build();

            agendamentoRepository.save(novoAgendamento);
        }

        carrinho.getItens().clear();
        carrinhoRepository.save(carrinho);
    }
}
