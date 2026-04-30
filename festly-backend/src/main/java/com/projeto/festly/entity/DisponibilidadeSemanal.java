package com.projeto.festly.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Entity
@Table(
        name = "disponibilidades_semanais",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_disp_semanal_servico_dia_inicio",
                columnNames = {"servico_id", "dia_semana", "hora_inicio"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DisponibilidadeSemanal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "servico_id", nullable = false)
    private Servico servico;

    @Enumerated(EnumType.STRING)
    @Column(name = "dia_semana", nullable = false, length = 12)
    private DayOfWeek diaSemana;

    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio;

    @Column(name = "hora_fim", nullable = false)
    private LocalTime horaFim;

    @Column(name = "duracao_minutos", nullable = false)
    private int duracaoMinutos;
}
