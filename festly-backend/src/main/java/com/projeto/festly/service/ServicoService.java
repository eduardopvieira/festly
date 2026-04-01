package com.projeto.festly.service;

import com.projeto.festly.dto.ServicoRequest;
import com.projeto.festly.dto.ServicoResponse;
import com.projeto.festly.entity.CategoriaServico;
import com.projeto.festly.entity.Fornecedor;
import com.projeto.festly.entity.Servico;
import com.projeto.festly.repository.ServicoRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ServicoService {

    private final ServicoRepository repository;
    private final FornecedorService fornecedorService;

    public ServicoResponse criar(ServicoRequest request) {
        Fornecedor fornecedor = fornecedorService.buscarEntidade(request.getFornecedorId());
        Servico servico = Servico.builder()
                .nome(request.getNome())
                .descricao(request.getDescricao())
                .preco(request.getPreco())
                .categoria(request.getCategoria())
                .disponivel(request.isDisponivel())
                .fornecedor(fornecedor)
                .build();
        return ServicoResponse.from(repository.save(servico));
    }

    public List<ServicoResponse> listar(CategoriaServico categoria, BigDecimal precoMax, Boolean disponivel) {
        List<Servico> servicos = repository.findAll();

        return servicos.stream()
                .filter(s -> categoria == null || s.getCategoria() == categoria)
                .filter(s -> precoMax == null || s.getPreco().compareTo(precoMax) <= 0)
                .filter(s -> disponivel == null || s.isDisponivel() == disponivel)
                .map(ServicoResponse::from)
                .toList();
    }

    public ServicoResponse buscarPorId(Long id) {
        return ServicoResponse.from(buscarEntidade(id));
    }

    public List<ServicoResponse> listarPorFornecedor(Long fornecedorId) {
        return repository.findByFornecedor_Id(fornecedorId).stream()
                .map(ServicoResponse::from)
                .toList();
    }

    public ServicoResponse atualizar(Long id, ServicoRequest request) {
        Fornecedor fornecedor = fornecedorService.buscarEntidade(request.getFornecedorId());
        Servico servico = buscarEntidade(id);
        servico.setNome(request.getNome());
        servico.setDescricao(request.getDescricao());
        servico.setPreco(request.getPreco());
        servico.setCategoria(request.getCategoria());
        servico.setDisponivel(request.isDisponivel());
        servico.setFornecedor(fornecedor);
        return ServicoResponse.from(repository.save(servico));
    }

    public void remover(Long id) {
        buscarEntidade(id);
        repository.deleteById(id);
    }

    private Servico buscarEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Serviço não encontrado: " + id));
    }
}
