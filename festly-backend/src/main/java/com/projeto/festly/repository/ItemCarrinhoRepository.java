package com.projeto.festly.repository;

import com.projeto.festly.entity.ItemCarrinho;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ItemCarrinhoRepository extends JpaRepository<ItemCarrinho, Long> {

    @Query("SELECT i FROM ItemCarrinho i " +
            "JOIN FETCH i.carrinho c " +
            "JOIN FETCH c.usuario " +
            "WHERE i.servico.id = :servicoId " +
            "AND i.dataEvento BETWEEN :inicio AND :fim " +
            "AND i.horarioEvento IS NOT NULL")
    List<ItemCarrinho> findReservasNoIntervalo(
            @Param("servicoId") Long servicoId,
            @Param("inicio") LocalDate inicio,
            @Param("fim") LocalDate fim
    );
}
