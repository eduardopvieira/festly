package com.projeto.festly.service;

import com.projeto.festly.dto.FornecedorRequest;
import com.projeto.festly.dto.FornecedorResponse;
import com.projeto.festly.entity.Fornecedor;
import com.projeto.festly.repository.FornecedorRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FornecedorService {

    private final FornecedorRepository repository;

    public FornecedorResponse criar(FornecedorRequest request) {
        Fornecedor fornecedor = Fornecedor.builder()
                .nome(request.getNome())
                .email(request.getEmail())
                .telefone(request.getTelefone())
                .cnpj(request.getCnpj())
                .descricao(request.getDescricao())
                .build();
        return FornecedorResponse.from(repository.save(fornecedor));
    }

    public List<FornecedorResponse> listar() {
        return repository.findAll().stream()
                .map(FornecedorResponse::from)
                .toList();
    }

    public FornecedorResponse buscarPorId(Long id) {
        return FornecedorResponse.from(buscarEntidade(id));
    }

    public FornecedorResponse atualizar(Long id, FornecedorRequest request) {
        Fornecedor fornecedor = buscarEntidade(id);
        fornecedor.setNome(request.getNome());
        fornecedor.setEmail(request.getEmail());
        fornecedor.setTelefone(request.getTelefone());
        fornecedor.setCnpj(request.getCnpj());
        fornecedor.setDescricao(request.getDescricao());
        return FornecedorResponse.from(repository.save(fornecedor));
    }

    public void remover(Long id) {
        buscarEntidade(id);
        repository.deleteById(id);
    }

    public Fornecedor buscarEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Fornecedor não encontrado: " + id));
    }
}
