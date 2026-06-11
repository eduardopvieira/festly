package com.projeto.festly.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "servico_fotos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServicoFoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "servico_id", nullable = false)
    private Servico servico;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(nullable = false)
    private Integer ordem;
}
