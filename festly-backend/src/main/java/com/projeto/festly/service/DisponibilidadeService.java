package com.projeto.festly.service;

import com.projeto.festly.dto.BlocoHorarioResponse;
import com.projeto.festly.dto.BlocoStatus;
import com.projeto.festly.dto.DisponibilidadeSemanalItem;
import com.projeto.festly.dto.DisponibilidadeSemanalRequest;
import com.projeto.festly.dto.DisponibilidadeSemanalResponse;
import com.projeto.festly.entity.Agendamento;
import com.projeto.festly.entity.DisponibilidadeSemanal;
import com.projeto.festly.entity.ItemCarrinho;
import com.projeto.festly.entity.Servico;
import com.projeto.festly.entity.Usuario;
import com.projeto.festly.repository.AgendamentoRepository;
import com.projeto.festly.repository.DisponibilidadeSemanalRepository;
import com.projeto.festly.repository.ItemCarrinhoRepository;
import com.projeto.festly.repository.ServicoRepository;
import com.projeto.festly.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.AbstractMap;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DisponibilidadeService {

    private static final int HORIZONTE_DIAS = 60;

    private final DisponibilidadeSemanalRepository disponibilidadeRepository;
    private final AgendamentoRepository agendamentoRepository;
    private final ItemCarrinhoRepository itemCarrinhoRepository;
    private final ServicoRepository servicoRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public List<DisponibilidadeSemanalResponse> definirDisponibilidade(
            Long servicoId,
            String prestadorEmail,
            DisponibilidadeSemanalRequest request
    ) {
        Servico servico = servicoDoPrestador(servicoId, prestadorEmail);
        validarRegras(request.getRegras());

        disponibilidadeRepository.deleteByServicoId(servicoId);

        List<DisponibilidadeSemanal> entidades = request.getRegras().stream()
                .map(item -> DisponibilidadeSemanal.builder()
                        .servico(servico)
                        .diaSemana(item.getDiaSemana())
                        .horaInicio(item.getHoraInicio())
                        .horaFim(item.getHoraFim())
                        .duracaoMinutos(item.getDuracaoMinutos())
                        .build())
                .toList();

        return disponibilidadeRepository.saveAll(entidades).stream()
                .map(DisponibilidadeSemanalResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DisponibilidadeSemanalResponse> listarRegras(Long servicoId) {
        if (!servicoRepository.existsById(servicoId)) {
            throw new EntityNotFoundException("Serviço não encontrado: " + servicoId);
        }
        return disponibilidadeRepository.findByServicoIdOrderByDiaSemanaAscHoraInicioAsc(servicoId).stream()
                .map(DisponibilidadeSemanalResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BlocoHorarioResponse> gerarBlocos(Long servicoId, LocalDate inicio, LocalDate fim, String emailUsuario) {
        if (!servicoRepository.existsById(servicoId)) {
            throw new EntityNotFoundException("Serviço não encontrado: " + servicoId);
        }

        LocalDate hoje = LocalDate.now();
        LocalDate inicioReal = inicio == null || inicio.isBefore(hoje) ? hoje : inicio;
        LocalDate limite = hoje.plusDays(HORIZONTE_DIAS);
        LocalDate fimReal = fim == null || fim.isAfter(limite) ? limite : fim;
        if (fimReal.isBefore(inicioReal)) {
            return List.of();
        }

        List<DisponibilidadeSemanal> regras = disponibilidadeRepository
                .findByServicoIdOrderByDiaSemanaAscHoraInicioAsc(servicoId);
        if (regras.isEmpty()) {
            return List.of();
        }

        Map<DayOfWeek, List<DisponibilidadeSemanal>> regrasPorDia = regras.stream()
                .collect(Collectors.groupingBy(DisponibilidadeSemanal::getDiaSemana));

        Set<Map.Entry<LocalDate, LocalTime>> reservadosConfirmados = agendamentoRepository
                .findAtivosNoIntervalo(servicoId, inicioReal, fimReal)
                .stream()
                .filter(a -> a.getHorarioEvento() != null)
                .map(a -> (Map.Entry<LocalDate, LocalTime>) new AbstractMap.SimpleEntry<>(
                        a.getDataEvento(), a.getHorarioEvento()))
                .collect(Collectors.toCollection(HashSet::new));

        Long usuarioId = null;
        if (emailUsuario != null) {
            usuarioId = usuarioRepository.findByEmail(emailUsuario).map(Usuario::getId).orElse(null);
        }
        Set<Map.Entry<LocalDate, LocalTime>> meusItensCarrinho = new HashSet<>();
        Set<Map.Entry<LocalDate, LocalTime>> itensCarrinhoOutros = new HashSet<>();
        for (ItemCarrinho item : itemCarrinhoRepository.findReservasNoIntervalo(servicoId, inicioReal, fimReal)) {
            Map.Entry<LocalDate, LocalTime> chave = new AbstractMap.SimpleEntry<>(
                    item.getDataEvento(), item.getHorarioEvento());
            Long donoId = item.getCarrinho().getUsuario().getId();
            if (usuarioId != null && donoId.equals(usuarioId)) {
                meusItensCarrinho.add(chave);
            } else {
                itensCarrinhoOutros.add(chave);
            }
        }

        LocalDateTime agora = LocalDateTime.now();
        List<BlocoHorarioResponse> blocos = new ArrayList<>();

        for (LocalDate data = inicioReal; !data.isAfter(fimReal); data = data.plusDays(1)) {
            List<DisponibilidadeSemanal> regrasDoDia = regrasPorDia.get(data.getDayOfWeek());
            if (regrasDoDia == null) continue;

            for (DisponibilidadeSemanal regra : regrasDoDia) {
                LocalTime hora = regra.getHoraInicio();
                while (!hora.plusMinutes(regra.getDuracaoMinutos()).isAfter(regra.getHoraFim())) {
                    LocalDateTime momento = LocalDateTime.of(data, hora);
                    Map.Entry<LocalDate, LocalTime> chave = new AbstractMap.SimpleEntry<>(data, hora);
                    BlocoStatus status;
                    if (momento.isBefore(agora)) {
                        status = BlocoStatus.INDISPONIVEL;
                    } else if (meusItensCarrinho.contains(chave)) {
                        status = BlocoStatus.MEU;
                    } else if (reservadosConfirmados.contains(chave) || itensCarrinhoOutros.contains(chave)) {
                        status = BlocoStatus.RESERVADO;
                    } else {
                        status = BlocoStatus.DISPONIVEL;
                    }
                    blocos.add(BlocoHorarioResponse.builder()
                            .data(data)
                            .hora(hora)
                            .duracaoMinutos(regra.getDuracaoMinutos())
                            .status(status)
                            .build());
                    hora = hora.plusMinutes(regra.getDuracaoMinutos());
                }
            }
        }

        blocos.sort((a, b) -> {
            int cmp = a.getData().compareTo(b.getData());
            return cmp != 0 ? cmp : a.getHora().compareTo(b.getHora());
        });
        return blocos;
    }

    boolean horarioPermitido(Long servicoId, LocalDate data, LocalTime hora) {
        return disponibilidadeRepository
                .findByServicoIdOrderByDiaSemanaAscHoraInicioAsc(servicoId).stream()
                .filter(regra -> regra.getDiaSemana() == data.getDayOfWeek())
                .anyMatch(regra -> {
                    if (hora.isBefore(regra.getHoraInicio()) || hora.isAfter(regra.getHoraFim())) {
                        return false;
                    }
                    long minutosDoInicio = java.time.Duration.between(regra.getHoraInicio(), hora).toMinutes();
                    if (minutosDoInicio % regra.getDuracaoMinutos() != 0) {
                        return false;
                    }
                    return !hora.plusMinutes(regra.getDuracaoMinutos()).isAfter(regra.getHoraFim());
                });
    }

    private void validarRegras(List<DisponibilidadeSemanalItem> regras) {
        for (DisponibilidadeSemanalItem regra : regras) {
            if (!regra.getHoraInicio().isBefore(regra.getHoraFim())) {
                throw new IllegalArgumentException(
                        "A hora de início deve ser anterior à hora de fim em " + regra.getDiaSemana()
                );
            }
            long minutos = java.time.Duration.between(regra.getHoraInicio(), regra.getHoraFim()).toMinutes();
            if (minutos < regra.getDuracaoMinutos()) {
                throw new IllegalArgumentException(
                        "O intervalo em " + regra.getDiaSemana() + " é menor que a duração de um bloco"
                );
            }
        }
    }

    private Servico servicoDoPrestador(Long servicoId, String prestadorEmail) {
        Usuario prestador = usuarioRepository.findByEmail(prestadorEmail)
                .orElseThrow(() -> new EntityNotFoundException("Prestador não encontrado."));

        Servico servico = servicoRepository.findById(servicoId)
                .orElseThrow(() -> new EntityNotFoundException("Serviço não encontrado: " + servicoId));

        if (!servico.getUsuario().getId().equals(prestador.getId())) {
            throw new IllegalStateException("Você só pode editar disponibilidade dos seus próprios serviços.");
        }
        return servico;
    }
}
