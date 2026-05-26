package com.projeto.festly.repository;

import com.projeto.festly.entity.ItemPagamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ItemPagamentoRepository extends JpaRepository<ItemPagamento, Long> {
    Optional<ItemPagamento> findByAgendamentoId(Long agendamentoId);
}
