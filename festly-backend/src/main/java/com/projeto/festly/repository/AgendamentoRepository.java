package com.projeto.festly.repository;

import com.projeto.festly.entity.Agendamento;
import com.projeto.festly.entity.StatusAgendamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {

    @Query("SELECT a.dataEvento FROM Agendamento a " +
            "WHERE a.servico.id = :servicoId " +
            "AND a.status <> 'CANCELADO'")
    List<LocalDate> findDatasOcupadasByServicoId(@Param("servicoId") Long servicoId);

    boolean existsByServicoIdAndDataEventoAndStatusNot(
            Long servicoId,
            LocalDate dataEvento,
            StatusAgendamento status
    );
}