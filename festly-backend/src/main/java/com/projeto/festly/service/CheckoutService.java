package com.projeto.festly.service;

import com.projeto.festly.dto.CheckoutRequest;
import com.projeto.festly.dto.PagamentoResponse;
import com.projeto.festly.entity.*;
import com.projeto.festly.repository.*;
import com.projeto.festly.service.payment.PaymentProvider;
import com.projeto.festly.service.payment.dto.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CheckoutService {

    private final CarrinhoRepository carrinhoRepo;
    private final UsuarioRepository usuarioRepo;
    private final AgendamentoRepository agendamentoRepo;
    private final PagamentoRepository pagamentoRepo;
    private final ItemPagamentoRepository itemPagamentoRepo;
    private final DisponibilidadeService disponibilidadeService;
    private final PaymentProvider paymentProvider;

    @Value("${asaas.pix-expiration-minutes:30}")
    private int pixExpirationMinutes;

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public PagamentoResponse checkout(Long clienteId, CheckoutRequest req) {
        Usuario cliente = usuarioRepo.findById(clienteId)
            .orElseThrow(() -> new EntityNotFoundException("Cliente não encontrado: " + clienteId));

        Carrinho carrinho = carrinhoRepo.findByUsuarioId(clienteId)
            .orElseThrow(() -> new IllegalStateException("Seu carrinho está vazio."));
        if (carrinho.getItens().isEmpty())
            throw new IllegalStateException("Seu carrinho está vazio.");

        for (ItemCarrinho item : carrinho.getItens()) {
            if (!disponibilidadeService.intervaloDentroDaAgenda(
                    item.getServico().getId(), item.getInicio(), item.getFim())) {
                throw new IllegalStateException(
                    "O horário do serviço '" + item.getServico().getNome() + "' está fora da agenda.");
            }
            if (agendamentoRepo.existsActiveConflict(
                    item.getServico().getId(), item.getInicio(), item.getFim())) {
                throw new IllegalStateException(
                    "O horário do serviço '" + item.getServico().getNome() + "' já foi reservado.");
            }
        }

        LocalDateTime expiresAt = req.metodo() == MetodoPagamento.PIX
            ? LocalDateTime.now().plusMinutes(pixExpirationMinutes) : null;

        BigDecimal total = carrinho.getItens().stream()
            .map(this::calcularValor)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        Pagamento pagamento = Pagamento.builder()
            .cliente(cliente)
            .valorTotal(total)
            .metodo(req.metodo())
            .status(StatusPagamento.AGUARDANDO)
            .provider(paymentProvider.nome())
            .expiresAt(expiresAt)
            .build();
        pagamento = pagamentoRepo.saveAndFlush(pagamento);

        for (ItemCarrinho item : carrinho.getItens()) {
            Agendamento ag = Agendamento.builder()
                .servico(item.getServico())
                .cliente(cliente)
                .inicio(item.getInicio()).fim(item.getFim())
                .status(StatusAgendamento.AGUARDANDO_PAGAMENTO)
                .numeroPessoas(item.getNumeroPessoas())
                .rua(item.getRua()).numero(item.getNumero()).bairro(item.getBairro())
                .cidade(item.getCidade()).estado(item.getEstado()).cep(item.getCep())
                .complemento(item.getComplemento()).tipoEvento(item.getTipoEvento())
                .observacoes(item.getObservacoes())
                .build();
            try {
                ag = agendamentoRepo.saveAndFlush(ag);
            } catch (DataIntegrityViolationException ex) {
                throw new IllegalStateException("Conflito de horário durante checkout.");
            }

            ItemPagamento ip = ItemPagamento.builder()
                .pagamento(pagamento)
                .agendamento(ag)
                .valor(calcularValor(item))
                .status(StatusItemPagamento.ATIVO)
                .build();
            pagamento.getItens().add(itemPagamentoRepo.save(ip));
        }

        CobrancaCriada cobr = paymentProvider.criarCobranca(new NovaCobrancaRequest(
            String.valueOf(pagamento.getId()),
            cliente.getNome(),
            cliente.getEmail(),
            cliente.getCpf() != null ? cliente.getCpf() : "00000000000",
            total,
            req.metodo(),
            req.cartao() == null ? null : new DadosCartao(
                req.cartao().numero(), req.cartao().titular(),
                req.cartao().validadeMes(), req.cartao().validadeAno(), req.cartao().cvv(),
                req.cartao().cpfTitular(), req.cartao().cep(), req.cartao().numeroEndereco()),
            expiresAt,
            "Festly — pagamento #" + pagamento.getId()
        ));

        pagamento.setProviderChargeId(cobr.providerChargeId());
        pagamento.setPixQrCode(cobr.pixQrCode());
        pagamento.setPixQrCodeImage(cobr.pixQrCodeBase64());

        if (cobr.status() == StatusCobranca.CONFIRMADO) {
            pagamento.setStatus(StatusPagamento.CONFIRMADO);
            pagamento.setConfirmedAt(LocalDateTime.now());
            for (ItemPagamento ip : pagamento.getItens()) {
                ip.getAgendamento().setStatus(StatusAgendamento.PENDENTE);
            }
        }

        carrinho.getItens().clear();
        carrinhoRepo.save(carrinho);

        return PagamentoResponse.from(pagamento);
    }

    private BigDecimal calcularValor(ItemCarrinho item) {
        BigDecimal preco = item.getServico().getPreco();
        TipoCobranca tipo = item.getServico().getTipoCobranca();
        return switch (tipo) {
            case POR_EVENTO -> preco;
            case POR_PESSOA -> preco.multiply(BigDecimal.valueOf(
                item.getNumeroPessoas() == null ? 1 : item.getNumeroPessoas()));
            case POR_HORA -> {
                long horas = java.time.Duration.between(item.getInicio(), item.getFim()).toHours();
                yield preco.multiply(BigDecimal.valueOf(Math.max(1, horas)));
            }
        };
    }
}
