package com.projeto.festly.config;

import com.projeto.festly.entity.*;
import com.projeto.festly.repository.ServicoRepository;
import com.projeto.festly.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final ServicoRepository servicoRepository;
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
                .tipoUsuario(TipoUsuario.PRESTADOR)
                .verificado(true)
                .build());

        Usuario prestador2 = usuarioRepository.save(Usuario.builder()
                .nome("Prestador Dois")
                .email("prestador2@gmail.com")
                .senha(senha)
                .cnpj("00000000000102")
                .tipoUsuario(TipoUsuario.PRESTADOR)
                .verificado(true)
                .build());

        usuarioRepository.save(Usuario.builder()
                .nome("Cliente Um")
                .email("cliente1@gmail.com")
                .senha(senha)
                .cpf("00000000001")
                .tipoUsuario(TipoUsuario.CLIENTE)
                .verificado(true)
                .build());

        usuarioRepository.save(Usuario.builder()
                .nome("Cliente Dois")
                .email("cliente2@gmail.com")
                .senha(senha)
                .cpf("00000000002")
                .tipoUsuario(TipoUsuario.CLIENTE)
                .verificado(true)
                .build());

        servicoRepository.saveAll(servicosDe(prestador1, "P1"));
        servicoRepository.saveAll(servicosDe(prestador2, "P2"));
    }

    private List<Servico> servicosDe(Usuario prestador, String tag) {
        return List.of(
                build(prestador, "Buffet Completo " + tag,
                        "Buffet com cardápio variado para eventos de até 200 pessoas.",
                        "45.00", CategoriaServico.BUFFET, TipoCobranca.POR_PESSOA, "Natal"),
                build(prestador, "DJ Profissional " + tag,
                        "Show musical com equipamentos de ponta para festas e eventos.",
                        "1200.00", CategoriaServico.DJ, TipoCobranca.POR_EVENTO, "Mossoró"),
                build(prestador, "Decoração Temática " + tag,
                        "Decoração personalizada para festas infantis e adultos.",
                        "1500.00", CategoriaServico.DECORACAO, TipoCobranca.POR_EVENTO, "Parnamirim"),
                build(prestador, "Fotografia de Eventos " + tag,
                        "Cobertura fotográfica completa com entrega de álbum digital.",
                        "1800.00", CategoriaServico.FOTOGRAFIA, TipoCobranca.POR_EVENTO, "Caicó"),
                build(prestador, "Iluminação Cênica " + tag,
                        "Projeto de iluminação para palcos, casamentos e corporativos.",
                        "900.00", CategoriaServico.ILUMINACAO, TipoCobranca.POR_EVENTO, "Natal"),
                build(prestador, "Som Profissional " + tag,
                        "Locação de caixas de som, microfones e mesa de som.",
                        "150.00", CategoriaServico.SOM, TipoCobranca.POR_HORA, "Mossoró"),
                build(prestador, "Segurança Patrimonial " + tag,
                        "Equipe de segurança treinada para eventos privados.",
                        "200.00", CategoriaServico.SEGURANCA, TipoCobranca.POR_HORA, "Apodi"),
                build(prestador, "Animação Infantil " + tag,
                        "Recreação com palhaços, mágicos e personagens temáticos.",
                        "800.00", CategoriaServico.ANIMACAO, TipoCobranca.POR_EVENTO, "Natal"),
                build(prestador, "Cerimonialista " + tag,
                        "Organização e condução de casamentos e eventos formais.",
                        "2500.00", CategoriaServico.OUTROS, TipoCobranca.POR_EVENTO, "Mossoró"),
                build(prestador, "Espaço para Eventos " + tag,
                        "Salão climatizado com capacidade para 300 pessoas.",
                        "350.00", CategoriaServico.OUTROS, TipoCobranca.POR_HORA, "Parnamirim")
        );
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
