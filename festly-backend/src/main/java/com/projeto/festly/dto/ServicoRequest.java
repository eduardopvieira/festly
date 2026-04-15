package com.projeto.festly.dto;

import com.projeto.festly.entity.CategoriaServico;
import com.projeto.festly.entity.TipoCobranca;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ServicoRequest {

    @NotBlank(message = "Nome é obrigatório")
    private String nome;

    private String descricao;

    @NotNull(message = "Preço é obrigatório")
    @DecimalMin(value = "0.01", message = "Preço deve ser maior que zero")
    private BigDecimal preco;

    @NotNull(message = "Categoria é obrigatória")
    private CategoriaServico categoria;

    private boolean disponivel = true;

    @NotNull(message = "ID do usuário é obrigatório")
    private Long usuarioId;

    @NotBlank(message = "A cidade é obrigatória")
    private String cidade;

    @NotNull(message = "O tipo de cobrança é obrigatório")
    private TipoCobranca tipoCobranca;

    private String imagemCapa;

}
