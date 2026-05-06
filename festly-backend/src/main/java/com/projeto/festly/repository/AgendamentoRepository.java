package com.projeto.festly.repository;

import com.projeto.festly.entity.Agendamento;
import com.projeto.festly.entity.StatusAgendamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {

    /**
     * Agendamentos ativos do serviço cujo intervalo intersecta [inicio, fim).
     * Critério de overlap: novo.inicio < existente.fim AND novo.fim > existente.inicio
     */
    @Query("""
            SELECT a FROM Agendamento a
            WHERE a.servico.id = :servicoId
              AND a.status <> com.projeto.festly.entity.StatusAgendamento.CANCELADO
              AND a.inicio < :fim
              AND a.fim    > :inicio
            """)
    List<Agendamento> findOverlapping(
            @Param("servicoId") Long servicoId,
            @Param("inicio") LocalDateTime inicio,
            @Param("fim") LocalDateTime fim
    );

    @Query("""
            SELECT (COUNT(a) > 0) FROM Agendamento a
            WHERE a.servico.id = :servicoId
              AND a.status <> :statusExcluido
              AND a.inicio < :fim
              AND a.fim    > :inicio
            """)
    boolean existsConflict(
            @Param("servicoId") Long servicoId,
            @Param("inicio") LocalDateTime inicio,
            @Param("fim") LocalDateTime fim,
            @Param("statusExcluido") StatusAgendamento statusExcluido
    );

    List<Agendamento> findByClienteIdOrderByInicioDesc(Long clienteId);
}
