package com.projeto.festly.repository;

import com.projeto.festly.entity.Avaliacao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AvaliacaoRepository extends JpaRepository<Avaliacao, Long> {

    Optional<Avaliacao> findByAgendamentoId(Long agendamentoId);

    boolean existsByAgendamentoId(Long agendamentoId);

    @Query("""
            SELECT a FROM Avaliacao a
            JOIN FETCH a.agendamento ag
            WHERE ag.servico.id = :servicoId
            ORDER BY a.createdAt DESC
            """)
    Page<Avaliacao> findByServicoIdOrderByCreatedAtDesc(
            @Param("servicoId") Long servicoId, Pageable pageable);

    /**
     * Agregação de nota média e total por serviço. Retorna apenas
     * serviços que TÊM avaliação; serviços sem avaliação devem ser
     * tratados como (null, 0) pelo chamador.
     */
    @Query("""
            SELECT ag.servico.id AS servicoId,
                   AVG(a.nota) AS media,
                   COUNT(a)    AS total
            FROM Avaliacao a
            JOIN a.agendamento ag
            WHERE ag.servico.id IN :servicoIds
            GROUP BY ag.servico.id
            """)
    List<AgregadoAvaliacaoProjection> findAgregadosByServicoIds(
            @Param("servicoIds") Collection<Long> servicoIds);

    interface AgregadoAvaliacaoProjection {
        Long getServicoId();
        Double getMedia();
        Long getTotal();
    }
}
