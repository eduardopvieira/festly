package com.projeto.festly.service;

import com.projeto.festly.dto.ServicoRequest;
import com.projeto.festly.dto.ServicoResponse;
import com.projeto.festly.entity.CategoriaServico;
import com.projeto.festly.entity.Servico;
import com.projeto.festly.entity.Usuario;
import com.projeto.festly.repository.ServicoRepository;
import com.projeto.festly.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ServicoService {

    private final ServicoRepository repository;
    private final UsuarioRepository usuarioRepository;

    public ServicoResponse criar(ServicoRequest request) {
        Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado: " + request.getUsuarioId()));
        Servico servico = Servico.builder()
                .nome(request.getNome())
                .descricao(request.getDescricao())
                .preco(request.getPreco())
                .categoria(request.getCategoria())
                .cidade(request.getCidade())
                .tipoCobranca(request.getTipoCobranca())
                .imagemCapa(request.getImagemCapa())
                .disponivel(request.isDisponivel())
                .usuario(usuario)
                .build();

        return ServicoResponse.from(repository.save(servico));
    }

    public Page<ServicoResponse> listar(String nome, CategoriaServico categoria, String cidade,
                                        BigDecimal precoMax, Long excludeUsuarioId, Pageable pageable) {
        Specification<Servico> spec = (root, query, cb) -> cb.conjunction();

        if (nome != null && !nome.isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.<String>get("nome")), "%" + nome.toLowerCase() + "%"));
        }
        if (categoria != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("categoria"), categoria));
        }
        if (cidade != null && !cidade.isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(cb.lower(root.<String>get("cidade")), cidade.toLowerCase()));
        }
        if (precoMax != null) {
            spec = spec.and((root, query, cb) ->
                    cb.lessThanOrEqualTo(root.<BigDecimal>get("preco"), precoMax));
        }
        if (excludeUsuarioId != null) {
            spec = spec.and((root, query, cb) ->
                    cb.notEqual(root.get("usuario").get("id"), excludeUsuarioId));
        }

        return repository.findAll(spec, pageable).map(ServicoResponse::from);
    }

    public ServicoResponse buscarPorId(Long id) {
        return ServicoResponse.from(buscarEntidade(id));
    }

    public List<ServicoResponse> listarPorUsuario(Long usuarioId) {
        return repository.findByUsuario_Id(usuarioId).stream()
                .map(ServicoResponse::from)
                .toList();
    }

    public ServicoResponse atualizar(Long id, ServicoRequest request) {
        Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado: " + request.getUsuarioId()));
        Servico servico = buscarEntidade(id);
        servico.setNome(request.getNome());
        servico.setDescricao(request.getDescricao());
        servico.setPreco(request.getPreco());
        servico.setCategoria(request.getCategoria());
        servico.setDisponivel(request.isDisponivel());
        servico.setCidade(request.getCidade());
        servico.setTipoCobranca(request.getTipoCobranca());
        servico.setUsuario(usuario);
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
