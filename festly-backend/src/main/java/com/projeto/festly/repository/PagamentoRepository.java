package com.projeto.festly.repository;

import com.projeto.festly.entity.Pagamento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PagamentoRepository extends JpaRepository<Pagamento, Long> {
    Optional<Pagamento> findByProviderChargeId(String providerChargeId);
    Optional<Pagamento> findFirstByPixQrCodeOrderByIdDesc(String pixQrCode);
    Page<Pagamento> findByClienteIdOrderByCreatedAtDesc(Long clienteId, Pageable pageable);
}
