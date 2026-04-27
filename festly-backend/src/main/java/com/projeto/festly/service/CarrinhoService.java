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

    // Em CarrinhoService.java, altera o método adicionarServico:
    @Transactional
    public CarrinhoResponse adicionarServico(Long usuarioId, Long servicoId, LocalDate dataEvento) {
        Carrinho carrinho = buscarOuCriar(usuarioId);
        Servico servico = servicoRepository.findById(servicoId)
                .orElseThrow(() -> new EntityNotFoundException("Serviço não encontrado: " + servicoId));

        // Verifica se já tem este serviço na MESMA data
        boolean jaExiste = carrinho.getItens().stream()
                .anyMatch(item -> item.getServico().getId().equals(servicoId) &&
                        item.getDataEvento().equals(dataEvento));
        if (jaExiste) {
            throw new IllegalStateException("Este serviço já está no carrinho para esta data");
        }

        ItemCarrinho novoItem = ItemCarrinho.builder()
                .carrinho(carrinho)
                .servico(servico)
                .dataEvento(dataEvento)
                .build();

        carrinho.getItens().add(novoItem);
        carrinhoRepository.save(carrinho);

        // NOTA: Se usas um campo valorTotal, lembra-te de o recalcular aqui!
        return CarrinhoResponse.from(carrinho);
    }

    // Altera também o removerServico para apagar através dos getItens():
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

    // Altera o limpar:
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

        // 1. Verificação em tempo real: As datas ainda estão livres?
        for (ItemCarrinho item : carrinho.getItens()) {
            boolean dataOcupada = agendamentoRepository.existsByServicoIdAndDataEventoAndStatusNot(
                    item.getServico().getId(),
                    item.getDataEvento(),
                    StatusAgendamento.CANCELADO
            );

            if (dataOcupada) {
                throw new IllegalStateException(
                        "Poxa! O serviço '" + item.getServico().getNome() +
                                "' acabou de ser reservado por outra pessoa para o dia " +
                                item.getDataEvento() + ". Remova-o do carrinho para continuar."
                );
            }
        }

        // 2. Transforma os itens do carrinho em Agendamentos definitivos
        for (ItemCarrinho item : carrinho.getItens()) {
            Agendamento novoAgendamento = Agendamento.builder()
                    .servico(item.getServico())
                    .cliente(carrinho.getUsuario())
                    .dataEvento(item.getDataEvento())
                    .status(StatusAgendamento.CONFIRMADO) // Simulando que o pagamento deu certo
                    .build();

            agendamentoRepository.save(novoAgendamento);
        }

        // 3. Limpa o carrinho após a compra
        carrinho.getItens().clear();
        carrinhoRepository.save(carrinho);
    }
}
