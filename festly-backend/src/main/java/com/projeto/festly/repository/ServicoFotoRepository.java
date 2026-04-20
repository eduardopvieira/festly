package com.projeto.festly.repository;

import com.projeto.festly.entity.ServicoFoto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServicoFotoRepository extends JpaRepository<ServicoFoto, Long> {
    long countByServico_Id(Long servicoId);
}
