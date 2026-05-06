package com.projeto.festly.repository;

import com.projeto.festly.entity.RegraDisponibilidade;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RegraDisponibilidadeRepository extends JpaRepository<RegraDisponibilidade, Long> {

    @EntityGraph(attributePaths = "intervalos")
    List<RegraDisponibilidade> findByServicoIdAndAtivaTrue(Long servicoId);

    @EntityGraph(attributePaths = "intervalos")
    List<RegraDisponibilidade> findByServicoIdOrderByIdAsc(Long servicoId);

    Optional<RegraDisponibilidade> findFirstByServicoId(Long servicoId);

    void deleteByServicoId(Long servicoId);
}
