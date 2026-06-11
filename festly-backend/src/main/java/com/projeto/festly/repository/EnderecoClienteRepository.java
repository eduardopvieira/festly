package com.projeto.festly.repository;

import com.projeto.festly.entity.EnderecoCliente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EnderecoClienteRepository extends JpaRepository<EnderecoCliente, Long> {
    List<EnderecoCliente> findByUsuarioId(Long usuarioId);
}
