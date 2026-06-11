package com.projeto.festly.config;

import com.projeto.festly.entity.*;
import com.projeto.festly.repository.RegraDisponibilidadeRepository;
import com.projeto.festly.repository.ServicoRepository;
import com.projeto.festly.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final ServicoRepository servicoRepository;
    private final RegraDisponibilidadeRepository regraRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (usuarioRepository.existsByEmail("prestador1@gmail.com")) {
            return;
        }

        String senha = passwordEncoder.encode("123456");

        Usuario prestador1 = usuarioRepository.save(Usuario.builder()
                .nome("Prestador Um")
                .email("prestador1@gmail.com")
                .senha(senha)
                .cnpj("00000000000101")
                .tipoUsuario(TipoUsuario.USUARIO)
                .verificado(true)
                .build());

        Usuario prestador2 = usuarioRepository.save(Usuario.builder()
                .nome("Prestador Dois")
                .email("prestador2@gmail.com")
                .senha(senha)
                .cnpj("00000000000102")
                .tipoUsuario(TipoUsuario.USUARIO)
                .verificado(true)
                .build());

        usuarioRepository.save(Usuario.builder()
                .nome("Cliente Um")
                .email("cliente1@gmail.com")
                .senha(senha)
                .cpf("00000000001")
                .tipoUsuario(TipoUsuario.USUARIO)
                .verificado(true)
                .build());

        usuarioRepository.save(Usuario.builder()
                .nome("Cliente Dois")
                .email("cliente2@gmail.com")
                .senha(senha)
                .cpf("00000000002")
                .tipoUsuario(TipoUsuario.USUARIO)
                .verificado(true)
                .build());

        seedServicos(prestador1, "P1");
        seedServicos(prestador2, "P2");
    }

    private void seedServicos(Usuario prestador, String tag) {
        // Buffet — POR_PESSOA — seg-dom, manhã e tarde
        Servico buffet = servicoRepository.save(build(prestador,
                "Buffet Completo " + tag,
                "Buffet com cardápio variado para eventos de até 200 pessoas.",
                "45.00", CategoriaServico.BUFFET, TipoCobranca.POR_PESSOA, "Natal"));
        addRegra(buffet, DayOfWeek.MONDAY, DayOfWeek.SUNDAY, 60,
                slot(9, 0, 12, 0), slot(14, 0, 18, 0));

        // DJ — POR_EVENTO — sex-dom, tarde e noite
        Servico dj = servicoRepository.save(build(prestador,
                "DJ Profissional " + tag,
                "Show musical com equipamentos de ponta para festas e eventos.",
                "1200.00", CategoriaServico.DJ, TipoCobranca.POR_EVENTO, "Mossoró"));
        addRegra(dj, DayOfWeek.FRIDAY, DayOfWeek.SUNDAY, 120,
                slot(14, 0, 18, 0), slot(19, 0, 23, 0));

        // Decoração — POR_EVENTO — seg-dom, manhã e tarde
        Servico decoracao = servicoRepository.save(build(prestador,
                "Decoração Temática " + tag,
                "Decoração personalizada para festas infantis e adultos.",
                "1500.00", CategoriaServico.DECORACAO, TipoCobranca.POR_EVENTO, "Parnamirim"));
        addRegra(decoracao, DayOfWeek.MONDAY, DayOfWeek.SUNDAY, 120,
                slot(8, 0, 12, 0), slot(14, 0, 18, 0));

        // Fotografia — POR_EVENTO — seg-dom, tarde e noite
        Servico foto = servicoRepository.save(build(prestador,
                "Fotografia de Eventos " + tag,
                "Cobertura fotográfica completa com entrega de álbum digital.",
                "1800.00", CategoriaServico.FOTOGRAFIA, TipoCobranca.POR_EVENTO, "Caicó"));
        addRegra(foto, DayOfWeek.MONDAY, DayOfWeek.SUNDAY, 120,
                slot(14, 0, 18, 0), slot(19, 0, 23, 0));

        // Iluminação — POR_EVENTO — seg-dom, tarde e noite
        Servico luz = servicoRepository.save(build(prestador,
                "Iluminação Cênica " + tag,
                "Projeto de iluminação para palcos, casamentos e corporativos.",
                "900.00", CategoriaServico.ILUMINACAO, TipoCobranca.POR_EVENTO, "Natal"));
        addRegra(luz, DayOfWeek.MONDAY, DayOfWeek.SUNDAY, 120,
                slot(14, 0, 18, 0), slot(19, 0, 23, 0));

        // Som — POR_HORA — seg-dom, tarde + noite com pernoite
        Servico som = servicoRepository.save(build(prestador,
                "Som Profissional " + tag,
                "Locação de caixas de som, microfones e mesa de som.",
                "150.00", CategoriaServico.SOM, TipoCobranca.POR_HORA, "Mossoró"));
        addRegra(som, DayOfWeek.MONDAY, DayOfWeek.SUNDAY, 60,
                slot(14, 0, 18, 0), slot(19, 0, 18, 0)); // 19h→18h(+1d) overnight

        // Segurança — POR_HORA — seg-dom, manhã e tarde
        Servico seg = servicoRepository.save(build(prestador,
                "Segurança Patrimonial " + tag,
                "Equipe de segurança treinada para eventos privados.",
                "200.00", CategoriaServico.SEGURANCA, TipoCobranca.POR_HORA, "Apodi"));
        addRegra(seg, DayOfWeek.MONDAY, DayOfWeek.SUNDAY, 60,
                slot(8, 0, 12, 0), slot(14, 0, 22, 0));

        // Animação — POR_EVENTO — sab-dom, manhã e tarde
        Servico animacao = servicoRepository.save(build(prestador,
                "Animação Infantil " + tag,
                "Recreação com palhaços, mágicos e personagens temáticos.",
                "800.00", CategoriaServico.ANIMACAO, TipoCobranca.POR_EVENTO, "Natal"));
        addRegra(animacao, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY, 120,
                slot(9, 0, 12, 0), slot(14, 0, 18, 0));

        // Cerimonialista — POR_EVENTO — seg-dom, manhã e tarde
        Servico cerim = servicoRepository.save(build(prestador,
                "Cerimonialista " + tag,
                "Organização e condução de casamentos e eventos formais.",
                "2500.00", CategoriaServico.OUTROS, TipoCobranca.POR_EVENTO, "Mossoró"));
        addRegra(cerim, DayOfWeek.MONDAY, DayOfWeek.SUNDAY, 180,
                slot(9, 0, 12, 0), slot(14, 0, 18, 0));

        // Espaço para Eventos — POR_HORA — seg-dom, tarde + noite com pernoite
        Servico espaco = servicoRepository.save(build(prestador,
                "Espaço para Eventos " + tag,
                "Salão climatizado com capacidade para 300 pessoas.",
                "350.00", CategoriaServico.OUTROS, TipoCobranca.POR_HORA, "Parnamirim"));
        addRegra(espaco, DayOfWeek.MONDAY, DayOfWeek.SUNDAY, 60,
                slot(14, 0, 18, 0), slot(19, 0, 18, 0)); // 19h→18h(+1d) overnight
    }

    private void addRegra(Servico servico, DayOfWeek diaInicio, DayOfWeek diaFim,
                          int duracaoMin, int[]... slots) {
        RegraDisponibilidade regra = regraRepository.save(RegraDisponibilidade.builder()
                .servico(servico)
                .diaInicio(diaInicio)
                .diaFim(diaFim)
                .duracaoPadraoMinutos(duracaoMin)
                .ativa(true)
                .build());

        for (int[] s : slots) {
            regra.getIntervalos().add(IntervaloHorario.builder()
                    .regra(regra)
                    .horaInicio(LocalTime.of(s[0], s[1]))
                    .horaFim(LocalTime.of(s[2], s[3]))
                    .build());
        }

        regraRepository.save(regra);
    }

    private int[] slot(int hIni, int mIni, int hFim, int mFim) {
        return new int[]{hIni, mIni, hFim, mFim};
    }

    private Servico build(Usuario prestador, String nome, String descricao,
                          String preco, CategoriaServico categoria,
                          TipoCobranca tipoCobranca, String cidade) {
        return Servico.builder()
                .nome(nome)
                .descricao(descricao)
                .preco(new BigDecimal(preco))
                .categoria(categoria)
                .tipoCobranca(tipoCobranca)
                .cidade(cidade)
                .disponivel(true)
                .usuario(prestador)
                .build();
    }
}
