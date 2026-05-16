package com.projeto.festly.service;

import com.projeto.festly.dto.BlocoHorarioResponse;
import com.projeto.festly.dto.BlocoStatus;
import com.projeto.festly.dto.DisponibilidadeRequest;
import com.projeto.festly.dto.IntervaloAgendaResponse;
import com.projeto.festly.dto.IntervaloHorarioPayload;
import com.projeto.festly.dto.RegraDisponibilidadePayload;
import com.projeto.festly.dto.RegraDisponibilidadeResponse;
import com.projeto.festly.entity.Agendamento;
import com.projeto.festly.entity.IntervaloHorario;
import com.projeto.festly.entity.ItemCarrinho;
import com.projeto.festly.entity.RegraDisponibilidade;
import com.projeto.festly.entity.Servico;
import com.projeto.festly.entity.Usuario;
import com.projeto.festly.repository.AgendamentoRepository;
import com.projeto.festly.repository.ItemCarrinhoRepository;
import com.projeto.festly.repository.RegraDisponibilidadeRepository;
import com.projeto.festly.repository.ServicoRepository;
import com.projeto.festly.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Núcleo do módulo de agenda.
 *
 * Responsabilidades:
 *  - Persistir as regras de disponibilidade do prestador (dias contínuos + intervalos).
 *  - Gerar dinamicamente os intervalos disponíveis para um serviço dentro de
 *    uma janela de datas, considerando:
 *      * intervalos contínuos de dias (ex: SEXTA → DOMINGO, com wrap-around);
 *      * múltiplos intervalos de horário por dia (ex: 08-12 e 14-18);
 *      * pernoite (hora_fim &lt;= hora_inicio é tratada como atravessar meia-noite);
 *      * subtração de reservas existentes (Agendamento + ItemCarrinho de outros);
 *      * marcação de itens do carrinho do próprio usuário como MEU.
 */
@Service
@RequiredArgsConstructor
public class DisponibilidadeService {

    private static final int HORIZONTE_DIAS_MAX = 90;

    private final RegraDisponibilidadeRepository regraRepository;
    private final AgendamentoRepository agendamentoRepository;
    private final ItemCarrinhoRepository itemCarrinhoRepository;
    private final ServicoRepository servicoRepository;
    private final UsuarioRepository usuarioRepository;

    // ---------------------------------------------------------------------
    // CRUD de regras
    // ---------------------------------------------------------------------

    @Transactional
    public List<RegraDisponibilidadeResponse> definirDisponibilidade(
            Long servicoId,
            String prestadorEmail,
            DisponibilidadeRequest request
    ) {
        Servico servico = servicoDoPrestador(servicoId, prestadorEmail);
        validarRegras(request.getRegras());

        regraRepository.deleteByServicoId(servicoId);
        regraRepository.flush();

        List<RegraDisponibilidade> regras = new ArrayList<>();
        for (RegraDisponibilidadePayload payload : request.getRegras()) {
            RegraDisponibilidade regra = RegraDisponibilidade.builder()
                    .servico(servico)
                    .diaInicio(payload.getDiaInicio())
                    .diaFim(payload.getDiaFim())
                    .duracaoPadraoMinutos(payload.getDuracaoPadraoMinutos())
                    .ativa(payload.isAtiva())
                    .intervalos(new ArrayList<>())
                    .build();

            for (IntervaloHorarioPayload it : payload.getIntervalos()) {
                regra.getIntervalos().add(IntervaloHorario.builder()
                        .regra(regra)
                        .horaInicio(it.getHoraInicio())
                        .horaFim(it.getHoraFim())
                        .build());
            }
            regras.add(regra);
        }

        return regraRepository.saveAll(regras).stream()
                .map(RegraDisponibilidadeResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RegraDisponibilidadeResponse> listarRegras(Long servicoId) {
        if (!servicoRepository.existsById(servicoId)) {
            throw new EntityNotFoundException("Serviço não encontrado: " + servicoId);
        }
        return regraRepository.findByServicoIdOrderByIdAsc(servicoId).stream()
                .map(RegraDisponibilidadeResponse::from)
                .toList();
    }

    // ---------------------------------------------------------------------
    // Geração da agenda — intervalos contínuos
    // ---------------------------------------------------------------------

    /**
     * Gera os intervalos contínuos da agenda do serviço, dentro da janela
     * [inicio, fim]. Intervalos podem ser DISPONIVEL, RESERVADO, INDISPONIVEL ou MEU.
     */
    @Transactional(readOnly = true)
    public List<IntervaloAgendaResponse> gerarIntervalos(
            Long servicoId,
            LocalDate inicio,
            LocalDate fim,
            String emailUsuario
    ) {
        if (!servicoRepository.existsById(servicoId)) {
            throw new EntityNotFoundException("Serviço não encontrado: " + servicoId);
        }

        LocalDate hoje = LocalDate.now();
        LocalDate inicioReal = (inicio == null || inicio.isBefore(hoje)) ? hoje : inicio;
        LocalDate limite = hoje.plusDays(HORIZONTE_DIAS_MAX);
        LocalDate fimReal = (fim == null || fim.isAfter(limite)) ? limite : fim;
        if (fimReal.isBefore(inicioReal)) {
            return List.of();
        }

        List<RegraDisponibilidade> regras = regraRepository.findByServicoIdAndAtivaTrue(servicoId);
        if (regras.isEmpty()) {
            return List.of();
        }

        // Olhamos um dia antes/depois para capturar intervalos com pernoite
        LocalDateTime janelaInicio = inicioReal.atStartOfDay().minusDays(1);
        LocalDateTime janelaFim = fimReal.plusDays(2).atStartOfDay();

        List<Reserva> reservasOutros = new ArrayList<>();
        List<Reserva> reservasMeu = new ArrayList<>();

        for (Agendamento a : agendamentoRepository.findOverlapping(servicoId, janelaInicio, janelaFim)) {
            reservasOutros.add(new Reserva(a.getInicio(), a.getFim()));
        }

        Long usuarioId = (emailUsuario == null) ? null
                : usuarioRepository.findByEmail(emailUsuario).map(Usuario::getId).orElse(null);

        for (ItemCarrinho item : itemCarrinhoRepository.findOverlapping(servicoId, janelaInicio, janelaFim)) {
            Reserva r = new Reserva(item.getInicio(), item.getFim());
            Long dono = item.getCarrinho().getUsuario().getId();
            if (usuarioId != null && dono.equals(usuarioId)) {
                reservasMeu.add(r);
            } else {
                reservasOutros.add(r);
            }
        }

        // 1) Construir intervalos brutos da agenda do prestador (mesclando regras sobrepostas)
        List<Reserva> bruto = construirIntervalosBrutos(regras, inicioReal, fimReal);
        bruto = mesclar(bruto);

        // 2) Cortar pelo "agora" (não oferecer passado)
        LocalDateTime agora = LocalDateTime.now();
        List<Reserva> agenda = subtrairAntesDe(bruto, agora);

        // 3) Recortar pela janela [inicioReal, fimReal+2d) para preservar intervalos pernoite
        //    que iniciam no último dia solicitado e terminam no dia seguinte (ex: 19h→19h).
        LocalDateTime cortaInicio = inicioReal.atStartOfDay();
        LocalDateTime cortaFim = fimReal.plusDays(2).atStartOfDay();
        agenda = recortar(agenda, cortaInicio, cortaFim);

        // 4) Computar partes "MEU" (interseção entre agenda e reservasMeu)
        //    e remover da agenda livre as reservas (próprias e de outros)
        List<Reserva> partesMeu = intersectarTudo(agenda, reservasMeu);
        List<Reserva> partesReservadasOutros = intersectarTudo(agenda, reservasOutros);
        List<Reserva> reservadosTotal = unirESubtrair(partesMeu, partesReservadasOutros);
        // partesReservadasOutros - partesMeu para evitar duplicidade visual
        List<Reserva> livres = subtrair(agenda, mesclar(reservadosTotal));

        // 5) Surfacing de residuais pernoite: caudas de reservas cross-day que terminam
        //    dentro do range pedido ficam "órfãs" do schedule regular do dia seguinte.
        //    Adicioná-las a livres garante que o cliente veja o horário no dia correto.
        List<Reserva> todasReservas = new ArrayList<>(reservasOutros);
        todasReservas.addAll(reservasMeu);
        List<Reserva> residuais = computarResiduaisPernoite(regras, todasReservas, inicioReal, fimReal);
        if (!residuais.isEmpty()) {
            List<Reserva> residuaisLivres = subtrair(residuais, mesclar(todasReservas));
            List<Reserva> livresMaisResiduais = new ArrayList<>(livres);
            livresMaisResiduais.addAll(residuaisLivres);
            livres = mesclar(livresMaisResiduais);
        }

        List<IntervaloAgendaResponse> resultado = new ArrayList<>();
        livres.forEach(r -> resultado.add(new IntervaloAgendaResponse(r.inicio, r.fim, BlocoStatus.DISPONIVEL)));
        partesMeu.forEach(r -> resultado.add(new IntervaloAgendaResponse(r.inicio, r.fim, BlocoStatus.MEU)));
        // outros - meu (caso uma reserva de outro caia exatamente onde também cair "meu")
        subtrair(partesReservadasOutros, partesMeu)
                .forEach(r -> resultado.add(new IntervaloAgendaResponse(r.inicio, r.fim, BlocoStatus.RESERVADO)));

        // 6) Ancoragem por data de início: só retornar intervalos cujo início cai dentro
        //    do range pedido. Impede que residuais gerados após meia-noite apareçam na
        //    consulta do dia anterior.
        LocalDateTime anchoraFim = fimReal.plusDays(1).atStartOfDay();
        resultado.removeIf(r ->
                r.getInicio().isBefore(cortaInicio) || !r.getInicio().isBefore(anchoraFim));

        resultado.sort(Comparator
                .comparing(IntervaloAgendaResponse::getInicio)
                .thenComparing(IntervaloAgendaResponse::getFim));
        return resultado;
    }

    /**
     * Gera blocos de duração fixa derivados dos intervalos contínuos.
     * Útil para uma UI mais simples (slots clicáveis).
     */
    @Transactional(readOnly = true)
    public List<BlocoHorarioResponse> gerarBlocos(
            Long servicoId,
            LocalDate inicio,
            LocalDate fim,
            Integer duracaoMinutos,
            String emailUsuario
    ) {
        List<IntervaloAgendaResponse> intervalos = gerarIntervalos(servicoId, inicio, fim, emailUsuario);
        int duracaoFinal = (duracaoMinutos != null && duracaoMinutos >= 15)
                ? duracaoMinutos
                : duracaoPadraoServico(servicoId);

        List<BlocoHorarioResponse> blocos = new ArrayList<>();
        for (IntervaloAgendaResponse intervalo : intervalos) {
            LocalDateTime ponteiro = intervalo.getInicio();
            while (!ponteiro.plusMinutes(duracaoFinal).isAfter(intervalo.getFim())) {
                LocalDateTime proximo = ponteiro.plusMinutes(duracaoFinal);
                blocos.add(BlocoHorarioResponse.builder()
                        .inicio(ponteiro)
                        .fim(proximo)
                        .duracaoMinutos(duracaoFinal)
                        .status(intervalo.getStatus())
                        .build());
                ponteiro = proximo;
            }
        }
        return blocos;
    }

    private int duracaoPadraoServico(Long servicoId) {
        return regraRepository.findFirstByServicoId(servicoId)
                .map(RegraDisponibilidade::getDuracaoPadraoMinutos)
                .orElse(30);
    }

    // ---------------------------------------------------------------------
    // Validação de "horário permitido" (usado no agendamento direto)
    // ---------------------------------------------------------------------

    /**
     * @return true se o intervalo [inicio, fim) está totalmente coberto pelas
     *         regras de disponibilidade do serviço (independente de reservas).
     */
    boolean intervaloDentroDaAgenda(Long servicoId, LocalDateTime inicio, LocalDateTime fim) {
        if (!inicio.isBefore(fim)) return false;
        List<RegraDisponibilidade> regras = regraRepository.findByServicoIdAndAtivaTrue(servicoId);
        if (regras.isEmpty()) return false;

        List<Reserva> bruto = construirIntervalosBrutos(
                regras,
                inicio.toLocalDate().minusDays(1),
                fim.toLocalDate().plusDays(1)
        );
        List<Reserva> mesclado = mesclar(bruto);
        return mesclado.stream().anyMatch(r ->
                !r.inicio.isAfter(inicio) && !r.fim.isBefore(fim)
        );
    }

    // ---------------------------------------------------------------------
    // Lógica de intervalos
    // ---------------------------------------------------------------------

    private List<Reserva> construirIntervalosBrutos(
            List<RegraDisponibilidade> regras,
            LocalDate diaInicio,
            LocalDate diaFim
    ) {
        List<Reserva> resultado = new ArrayList<>();
        for (LocalDate data = diaInicio; !data.isAfter(diaFim); data = data.plusDays(1)) {
            DayOfWeek dow = data.getDayOfWeek();
            for (RegraDisponibilidade regra : regras) {
                if (!regra.isAtiva()) continue;
                if (!diaDentroDoRange(dow, regra.getDiaInicio(), regra.getDiaFim())) continue;
                for (IntervaloHorario it : regra.getIntervalos()) {
                    LocalDateTime ini = LocalDateTime.of(data, it.getHoraInicio());
                    LocalDateTime fim;
                    if (it.atravessaMeiaNoite()) {
                        fim = LocalDateTime.of(data.plusDays(1), it.getHoraFim());
                    } else {
                        fim = LocalDateTime.of(data, it.getHoraFim());
                    }
                    resultado.add(new Reserva(ini, fim));
                }
            }
        }
        return resultado;
    }

    /**
     * Determina se {@code dia} está contido no range circular [inicio, fim].
     *
     * Exemplos:
     *   inicio=MON, fim=FRI → MON, TUE, WED, THU, FRI
     *   inicio=FRI, fim=SUN → FRI, SAT, SUN
     *   inicio=SAT, fim=TUE → SAT, SUN, MON, TUE (wrap-around)
     */
    static boolean diaDentroDoRange(DayOfWeek dia, DayOfWeek inicio, DayOfWeek fim) {
        int d = dia.getValue();
        int s = inicio.getValue();
        int e = fim.getValue();
        if (s <= e) {
            return d >= s && d <= e;
        }
        return d >= s || d <= e;
    }

    // ---------------------------------------------------------------------
    // Operações de conjunto sobre listas de intervalos (Reserva)
    // ---------------------------------------------------------------------

    private record Reserva(LocalDateTime inicio, LocalDateTime fim) {
        Reserva {
            if (!inicio.isBefore(fim)) {
                throw new IllegalArgumentException("Intervalo inválido: " + inicio + " >= " + fim);
            }
        }
    }

    /** Une intervalos sobrepostos/adjacentes em um único range. */
    private static List<Reserva> mesclar(List<Reserva> entrada) {
        if (entrada.isEmpty()) return List.of();
        List<Reserva> ordenado = new ArrayList<>(entrada);
        ordenado.sort(Comparator.comparing((Reserva r) -> r.inicio).thenComparing(r -> r.fim));
        List<Reserva> resultado = new ArrayList<>();
        Reserva atual = ordenado.get(0);
        for (int i = 1; i < ordenado.size(); i++) {
            Reserva prox = ordenado.get(i);
            if (!prox.inicio.isAfter(atual.fim)) {
                LocalDateTime novoFim = atual.fim.isAfter(prox.fim) ? atual.fim : prox.fim;
                atual = new Reserva(atual.inicio, novoFim);
            } else {
                resultado.add(atual);
                atual = prox;
            }
        }
        resultado.add(atual);
        return resultado;
    }

    /** Recorta a lista para que nada caia fora de [janelaInicio, janelaFim). */
    private static List<Reserva> recortar(
            List<Reserva> entrada,
            LocalDateTime janelaInicio,
            LocalDateTime janelaFim
    ) {
        List<Reserva> out = new ArrayList<>();
        for (Reserva r : entrada) {
            LocalDateTime ini = r.inicio.isBefore(janelaInicio) ? janelaInicio : r.inicio;
            LocalDateTime fim = r.fim.isAfter(janelaFim) ? janelaFim : r.fim;
            if (ini.isBefore(fim)) out.add(new Reserva(ini, fim));
        }
        return out;
    }

    /** Remove qualquer parte anterior a {@code corte}. */
    private static List<Reserva> subtrairAntesDe(List<Reserva> entrada, LocalDateTime corte) {
        List<Reserva> out = new ArrayList<>();
        for (Reserva r : entrada) {
            if (!r.fim.isAfter(corte)) continue;
            LocalDateTime ini = r.inicio.isBefore(corte) ? corte : r.inicio;
            if (ini.isBefore(r.fim)) out.add(new Reserva(ini, r.fim));
        }
        return out;
    }

    /** {@code base \ remover} (subtração de conjuntos de intervalos). */
    private static List<Reserva> subtrair(List<Reserva> base, List<Reserva> remover) {
        if (remover.isEmpty()) return new ArrayList<>(base);
        List<Reserva> rem = mesclar(remover);
        List<Reserva> out = new ArrayList<>();
        for (Reserva b : base) {
            LocalDateTime cursor = b.inicio;
            for (Reserva r : rem) {
                if (!r.fim.isAfter(cursor)) continue;
                if (!r.inicio.isBefore(b.fim)) break;
                if (r.inicio.isAfter(cursor)) {
                    out.add(new Reserva(cursor, r.inicio));
                }
                if (r.fim.isAfter(cursor)) {
                    cursor = r.fim;
                }
                if (!cursor.isBefore(b.fim)) break;
            }
            if (cursor.isBefore(b.fim)) {
                out.add(new Reserva(cursor, b.fim));
            }
        }
        return out;
    }

    /** Para cada par possivel, devolve a interseção (interseções vazias são ignoradas). */
    private static List<Reserva> intersectarTudo(List<Reserva> a, List<Reserva> b) {
        List<Reserva> out = new ArrayList<>();
        for (Reserva x : a) {
            for (Reserva y : b) {
                LocalDateTime ini = x.inicio.isAfter(y.inicio) ? x.inicio : y.inicio;
                LocalDateTime fim = x.fim.isBefore(y.fim) ? x.fim : y.fim;
                if (ini.isBefore(fim)) out.add(new Reserva(ini, fim));
            }
        }
        return mesclar(out);
    }

    /** Union(a, b) - mesclado. (Helper para legibilidade.) */
    private static List<Reserva> unirESubtrair(List<Reserva> a, List<Reserva> b) {
        List<Reserva> uniao = new ArrayList<>(a);
        uniao.addAll(b);
        return mesclar(uniao);
    }

    // ---------------------------------------------------------------------
    // Residuais de pernoite
    // ---------------------------------------------------------------------

    /**
     * Para cada dia D em [inicioReal, fimReal], localiza reservas que começaram no
     * Dia D-1 e terminam no Dia D (reservas cross-day). Para cada uma delas encontra
     * a janela overnight do Dia D-1 que a contém e devolve a cauda livre
     * (reserva.fim → janela.fim). Essas caudas representam tempo genuinamente
     * disponível que o schedule regular do Dia D não cobre sozinho.
     */
    private List<Reserva> computarResiduaisPernoite(
            List<RegraDisponibilidade> regras,
            List<Reserva> todasReservas,
            LocalDate inicioReal,
            LocalDate fimReal
    ) {
        List<Reserva> caudas = new ArrayList<>();
        for (LocalDate d = inicioReal; !d.isAfter(fimReal); d = d.plusDays(1)) {
            LocalDate prevDay = d.minusDays(1);
            for (Reserva reserva : todasReservas) {
                if (!reserva.inicio().toLocalDate().equals(prevDay)) continue;
                if (!reserva.fim().toLocalDate().equals(d)) continue;
                for (RegraDisponibilidade regra : regras) {
                    if (!regra.isAtiva()) continue;
                    if (!diaDentroDoRange(prevDay.getDayOfWeek(), regra.getDiaInicio(), regra.getDiaFim())) continue;
                    for (IntervaloHorario it : regra.getIntervalos()) {
                        if (!it.atravessaMeiaNoite()) continue;
                        LocalDateTime windowStart = LocalDateTime.of(prevDay, it.getHoraInicio());
                        LocalDateTime windowEnd   = LocalDateTime.of(d, it.getHoraFim());
                        if (reserva.inicio().isBefore(windowStart) || reserva.fim().isAfter(windowEnd)) continue;
                        if (reserva.fim().isBefore(windowEnd)) {
                            caudas.add(new Reserva(reserva.fim(), windowEnd));
                        }
                    }
                }
            }
        }
        return caudas.isEmpty() ? List.of() : mesclar(caudas);
    }

    // ---------------------------------------------------------------------
    // Validações e auxiliares
    // ---------------------------------------------------------------------

    private void validarRegras(List<RegraDisponibilidadePayload> regras) {
        for (RegraDisponibilidadePayload regra : regras) {
            if (regra.getIntervalos() == null || regra.getIntervalos().isEmpty()) {
                throw new IllegalArgumentException(
                        "Inclua pelo menos um intervalo de horário para a regra " +
                                regra.getDiaInicio() + " → " + regra.getDiaFim());
            }
            for (IntervaloHorarioPayload it : regra.getIntervalos()) {
                if (it.getHoraInicio() == null || it.getHoraFim() == null) {
                    throw new IllegalArgumentException("Hora de início e fim são obrigatórias.");
                }
                if (it.getHoraInicio().equals(it.getHoraFim())) {
                    throw new IllegalArgumentException("Intervalo com hora_inicio == hora_fim é inválido.");
                }
                long minutos = duracaoEmMinutos(it.getHoraInicio(), it.getHoraFim());
                if (minutos < regra.getDuracaoPadraoMinutos()) {
                    throw new IllegalArgumentException(
                            "Intervalo " + it.getHoraInicio() + "–" + it.getHoraFim() +
                                    " é menor que a duração padrão de um bloco.");
                }
            }
        }
    }

    private static long duracaoEmMinutos(LocalTime inicio, LocalTime fim) {
        if (fim.isAfter(inicio)) {
            return Duration.between(inicio, fim).toMinutes();
        }
        // pernoite: até 24h e depois até fim
        return Duration.between(inicio, LocalTime.MAX).toMinutes() + 1
                + Duration.between(LocalTime.MIN, fim).toMinutes();
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
