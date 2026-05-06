package com.projeto.festly.repository;

import com.projeto.festly.entity.ItemCarrinho;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ItemCarrinhoRepository extends JpaRepository<ItemCarrinho, Long> {

    /**
     * Itens em carrinhos (de qualquer usuário) cujo intervalo intersecta [inicio, fim).
     * Faz JOIN FETCH em carrinho/usuario porque o serviço precisa diferenciar
     * "MEU" vs "RESERVADO" comparando com o usuário autenticado.
     */
    @Query("""
            SELECT i FROM ItemCarrinho i
            JOIN FETCH i.carrinho c
            JOIN FETCH c.usuario
            WHERE i.servico.id = :servicoId
              AND i.inicio < :fim
              AND i.fim    > :inicio
            """)
    List<ItemCarrinho> findOverlapping(
            @Param("servicoId") Long servicoId,
            @Param("inicio") LocalDateTime inicio,
            @Param("fim") LocalDateTime fim
    );

    @Query("""
            SELECT (COUNT(i) > 0) FROM ItemCarrinho i
            WHERE i.servico.id = :servicoId
              AND i.carrinho.usuario.id <> :usuarioIdExcluido
              AND i.inicio < :fim
              AND i.fim    > :inicio
            """)
    boolean existsConflictExceptUser(
            @Param("servicoId") Long servicoId,
            @Param("inicio") LocalDateTime inicio,
            @Param("fim") LocalDateTime fim,
            @Param("usuarioIdExcluido") Long usuarioIdExcluido
    );
}
