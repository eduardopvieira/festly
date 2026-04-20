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

        servico.setCidade(request.getCidade());
        servico.setTipoCobranca(request.getTipoCobranca());
        servico.setImagemCapa(request.getImagemCapa());

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
