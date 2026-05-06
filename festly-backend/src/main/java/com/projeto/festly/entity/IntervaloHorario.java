package com.projeto.festly.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

@Entity
@Table(name = "intervalos_horario")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IntervaloHorario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "regra_id", nullable = false)
    private RegraDisponibilidade regra;

    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio;

    @Column(name = "hora_fim", nullable = false)
    private LocalTime horaFim;

    /**
     * @return true quando o intervalo cruza meia-noite (pernoite),
     *         indicando que o fim está no dia seguinte ao do início.
     */
    public boolean atravessaMeiaNoite() {
        return !horaFim.isAfter(horaInicio);
    }
}
