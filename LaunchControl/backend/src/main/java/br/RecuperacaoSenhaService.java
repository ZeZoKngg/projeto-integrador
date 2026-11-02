package br.com.launchcontrol;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

@Service
class RecuperacaoSenhaService {

    private final UsuarioRepo usuarios;
    private final TokenRecuperacaoSenhaRepo tokens;
    private final PasswordEncoder encoder;
    private final JavaMailSender mailSender;
    private final SecureRandom random = new SecureRandom();

    @Value("${app.frontend-url:http://localhost:8080}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String remetente;

    RecuperacaoSenhaService(
        UsuarioRepo usuarios,
        TokenRecuperacaoSenhaRepo tokens,
        PasswordEncoder encoder,
        JavaMailSender mailSender
    ) {
        this.usuarios = usuarios;
        this.tokens = tokens;
        this.encoder = encoder;
        this.mailSender = mailSender;
    }

    private String hash(String valor) {
        try {
            byte[] bytes = MessageDigest.getInstance("SHA-256")
                .digest(valor.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (Exception e) {
            throw new IllegalStateException("Erro ao gerar hash", e);
        }
    }

    void solicitar(String email) {
        var usuario = usuarios.findByEmail(
            email.trim().toLowerCase(java.util.Locale.ROOT)
        );

        if (usuario.isEmpty()) {
            return;
        }

        byte[] bytes = new byte[32];
        random.nextBytes(bytes);

        String token = Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString(bytes);

        TokenRecuperacaoSenha registro =
            new TokenRecuperacaoSenha(
                usuario.get(),
                hash(token),
                LocalDateTime.now().plusMinutes(15)
            );

        tokens.save(registro);

        String link = frontendUrl
            + "/?recuperarToken=" + token;

        SimpleMailMessage mensagem = new SimpleMailMessage();
        mensagem.setFrom(remetente);
        mensagem.setTo(usuario.get().email);
        mensagem.setSubject("LaunchControl - Recuperação de senha");
        mensagem.setText(
            "Olá, " + usuario.get().nome + "!\n\n"
            + "Recebemos uma solicitação para redefinir sua senha.\n\n"
            + "Acesse o link:\n" + link + "\n\n"
            + "Este link expira em 15 minutos.\n\n"
            + "Se você não solicitou, ignore este e-mail."
        );

        mailSender.send(mensagem);
    }

    @Transactional
    void redefinir(String token, String novaSenha) {

        TokenRecuperacaoSenha registro = tokens
            .findByTokenHash(hash(token))
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Link inválido ou expirado."
            ));

        if (registro.utilizado ||
            !registro.expiraEm.isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Link inválido ou expirado."
            );
        }

        if (novaSenha == null || novaSenha.length() < 8) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "A senha deve ter pelo menos 8 caracteres."
            );
        }

        registro.usuario.senha = encoder.encode(novaSenha);
        usuarios.save(registro.usuario);

        for (TokenRecuperacaoSenha t :
            tokens.findByUsuarioIdAndUtilizadoFalse(registro.usuario.id)) {
            t.utilizado = true;
            tokens.save(t);
        }
    }
}
