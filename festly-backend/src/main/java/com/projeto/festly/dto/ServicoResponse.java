package com.projeto.festly.dto;

import com.projeto.festly.entity.CategoriaServico;
import com.projeto.festly.entity.Servico;
import com.projeto.festly.entity.TipoCobranca;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ServicoResponse {

    private Long id;
    private String nome;
    private String descricao;
    private BigDecimal preco;
    private CategoriaServico categoria;
    private boolean disponivel;
    private Long usuarioId;
    private String nomePrestador;
    private String cidade;
    private TipoCobranca tipoCobranca;
    private List<ServicoFotoResponse> fotos;

    public static ServicoResponse from(Servico servico) {
        ServicoResponse response = new ServicoResponse();
        response.setId(servico.getId());
        response.setNome(servico.getNome());
        response.setDescricao(servico.getDescricao());
        response.setPreco(servico.getPreco());
        response.setCategoria(servico.getCategoria());
        response.setDisponivel(servico.isDisponivel());
        response.setUsuarioId(servico.getUsuario().getId());
        response.setNomePrestador(servico.getUsuario().getNome());
        response.setCidade(servico.getCidade());
        response.setTipoCobranca(servico.getTipoCobranca());
        response.setFotos(servico.getFotos().stream()
                .map(ServicoFotoResponse::from)
                .toList());
        return response;
    }
}
