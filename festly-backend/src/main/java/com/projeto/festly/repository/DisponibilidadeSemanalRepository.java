package com.projeto.festly.repository;

import com.projeto.festly.entity.DisponibilidadeSemanal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DisponibilidadeSemanalRepository extends JpaRepository<DisponibilidadeSemanal, Long> {

    List<DisponibilidadeSemanal> findByServicoIdOrderByDiaSemanaAscHoraInicioAsc(Long servicoId);

    void deleteByServicoId(Long servicoId);
}
