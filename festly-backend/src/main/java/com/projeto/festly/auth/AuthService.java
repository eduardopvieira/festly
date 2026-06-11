package com.projeto.festly.auth;

import com.projeto.festly.dto.*;
import com.projeto.festly.entity.TipoUsuario;
import com.projeto.festly.entity.Usuario;
import com.projeto.festly.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JavaMailSender mailSender;
    private final AuthenticationManager authenticationManager;

    public void register(RegisterRequest request) {
        boolean temCpf = request.getCpf() != null && !request.getCpf().isBlank();
        boolean temCnpj = request.getCnpj() != null && !request.getCnpj().isBlank();
        if (!temCpf && !temCnpj) {
            throw new IllegalArgumentException("Informe o CPF (pessoa física) ou o CNPJ (empresa/MEI)");
        }

        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new IllegalStateException("Email já cadastrado");
        }

        String codigo = "111111"; // generateCode(); // <--- colocar algum valor fixo para testes

        Usuario usuario = Usuario.builder()
                .nome(request.getNome())
                .email(request.getEmail())
                .senha(passwordEncoder.encode(request.getSenha()))
                .cpf(temCpf ? request.getCpf().replaceAll("\\D", "") : null)
                .cnpj(temCnpj ? request.getCnpj().replaceAll("\\D", "") : null)
                .tipoUsuario(TipoUsuario.USUARIO)
                .verificado(false)
                .codigoVerificacao(codigo)
                .codigoExpiracao(LocalDateTime.now().plusMinutes(15))
                .build();

        usuarioRepository.save(usuario);
        //sendVerificationEmail(usuario.getEmail(), usuario.getNome(), codigo); // <-- comentar quando for testar
    }

    public AuthResponse verify(VerifyRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

        if (usuario.isVerificado()) {
            throw new IllegalArgumentException("Email já verificado");
        }

        if (!request.getCodigo().equals(usuario.getCodigoVerificacao())) {
            throw new IllegalArgumentException("Código de verificação inválido");
        }

        if (usuario.getCodigoExpiracao().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Código de verificação expirado");
        }

        usuario.setVerificado(true);
        usuario.setCodigoVerificacao(null);
        usuario.setCodigoExpiracao(null);
        usuarioRepository.save(usuario);

        String token = jwtService.generateToken(usuario);
        return AuthResponse.builder()
                .token(token)
                .id(usuario.getId())
                .nome(usuario.getNome())
                .email(usuario.getEmail())
                .tipoUsuario(usuario.getTipoUsuario())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getSenha())
        );

        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));

        String token = jwtService.generateToken(usuario);
        return AuthResponse.builder()
                .token(token)
                .id(usuario.getId())
                .nome(usuario.getNome())
                .email(usuario.getEmail())
                .tipoUsuario(usuario.getTipoUsuario())
                .build();
    }

    public UsuarioResponse getMe(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));
        return UsuarioResponse.from(usuario);
    }

    private String generateCode() {
        SecureRandom random = new SecureRandom();
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }

    private void sendVerificationEmail(String to, String nome, String codigo) {
        try {
            jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject("Festly — Seu código de verificação");
            helper.setText(buildVerificationEmailHtml(nome, codigo), true);
            mailSender.send(message);
        } catch (jakarta.mail.MessagingException e) {
            throw new RuntimeException("Erro ao enviar e-mail de verificação", e);
        }
    }

    private String buildVerificationEmailHtml(String nome, String codigo) {
        String[] digits = codigo.split("");
        StringBuilder digitBoxes = new StringBuilder();
        for (String d : digits) {
            digitBoxes.append(
                "<td style=\"padding: 0 4px;\">" +
                "<div style=\"width:44px;height:52px;border:2px solid #7c3aed;border-radius:8px;" +
                "background:#faf5ff;display:inline-block;text-align:center;line-height:52px;" +
                "font-size:28px;font-weight:700;color:#18181b;font-family:'Segoe UI',Arial,sans-serif;\">" +
                d + "</div></td>"
            );
        }

        return "<!DOCTYPE html>" +
            "<html lang=\"pt-BR\">" +
            "<head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" +
            "<title>Verificação de e-mail — Festly</title></head>" +
            "<body style=\"margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;\">" +
            "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f4f4f5;padding:32px 16px;\">" +
            "<tr><td align=\"center\">" +
            "<table width=\"520\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:520px;width:100%;\">" +

            // Header
            "<tr><td style=\"background:#7c3aed;border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;\">" +
            "<span style=\"font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;\">✦ Festly</span>" +
            "</td></tr>" +

            // Body
            "<tr><td style=\"background:#ffffff;padding:36px 40px;\">" +
            "<p style=\"margin:0 0 8px;font-size:20px;font-weight:700;color:#18181b;\">Olá, " + nome + "!</p>" +
            "<p style=\"margin:0 0 28px;font-size:15px;color:#71717a;line-height:1.6;\">" +
            "Use o código abaixo para confirmar seu e-mail e ativar sua conta na Festly. " +
            "Ele expira em <strong style=\"color:#18181b;\">15 minutos</strong>." +
            "</p>" +

            // Code boxes
            "<table cellpadding=\"0\" cellspacing=\"0\" style=\"margin:0 auto 28px;\">" +
            "<tr>" + digitBoxes + "</tr></table>" +

            "<div style=\"background:#f4f4f5;border-radius:8px;padding:14px 18px;margin-bottom:24px;\">" +
            "<p style=\"margin:0;font-size:13px;color:#71717a;line-height:1.5;\">" +
            "Se você não criou uma conta na Festly, ignore este e-mail com segurança. " +
            "Nenhuma ação será tomada." +
            "</p></div>" +

            "<p style=\"margin:0;font-size:15px;color:#18181b;\">Com carinho,<br>" +
            "<strong>Equipe Festly</strong></p>" +
            "</td></tr>" +

            // Footer
            "<tr><td style=\"background:#f4f4f5;border-top:1px solid #e4e4e7;border-radius:0 0 12px 12px;" +
            "padding:20px 40px;text-align:center;\">" +
            "<p style=\"margin:0;font-size:12px;color:#a1a1aa;\">" +
            "© 2025 Festly. Todos os direitos reservados." +
            "</p></td></tr>" +

            "</table></td></tr></table>" +
            "</body></html>";
    }
}
