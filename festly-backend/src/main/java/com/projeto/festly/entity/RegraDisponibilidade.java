package com.projeto.festly.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.DayOfWeek;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "regras_disponibilidade")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegraDisponibilidade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "servico_id", nullable = false)
    private Servico servico;

    @Enumerated(EnumType.STRING)
    @Column(name = "dia_inicio", nullable = false, length = 12)
    private DayOfWeek diaInicio;

    @Enumerated(EnumType.STRING)
    @Column(name = "dia_fim", nullable = false, length = 12)
    private DayOfWeek diaFim;

    @Column(name = "duracao_padrao_minutos", nullable = false)
    private int duracaoPadraoMinutos;

    @Column(nullable = false)
    @Builder.Default
    private boolean ativa = true;

    @OneToMany(
            mappedBy = "regra",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.EAGER
    )
    @OrderBy("horaInicio ASC")
    @Builder.Default
    private List<IntervaloHorario> intervalos = new ArrayList<>();
}
