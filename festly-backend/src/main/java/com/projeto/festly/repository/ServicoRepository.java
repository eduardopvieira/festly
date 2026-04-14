package com.projeto.festly.repository;

import com.projeto.festly.entity.CategoriaServico;
import com.projeto.festly.entity.Servico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface ServicoRepository extends JpaRepository<Servico, Long>, JpaSpecificationExecutor<Servico> {

    List<Servico> findByUsuario_Id(Long usuarioId);

    List<Servico> findByCategoria(CategoriaServico categoria);

    List<Servico> findByDisponivelTrue();
}
