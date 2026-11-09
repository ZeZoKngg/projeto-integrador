
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

// Serviço responsável pelo processo de recuperação de senha.
// Permite solicitar um link por e-mail e cadastrar uma nova senha.
// O @Service indica que essa classe será gerenciada pelo Spring.
@Service
class RecuperacaoSenhaService {

    // Repositório utilizado para consultar e atualizar os usuários.
    private final UsuarioRepo usuarios;

    // Repositório responsável por salvar e consultar os tokens de recuperação.
    private final TokenRecuperacaoSenhaRepo tokens;

    // Utilizado para codificar a nova senha antes de salvar no banco.
    private final PasswordEncoder encoder;

    // Componente do Spring responsável pelo envio de e-mails.
    private final JavaMailSender mailSender;

    // Gera números aleatórios seguros para criar os tokens de recuperação.
    private final SecureRandom random = new SecureRandom();

    // Obtém o endereço do frontend a partir das configurações do projeto.
    // Caso não seja informado, utiliza http://localhost:8080.
    @Value("${app.frontend-url:http://localhost:8080}")
    private String frontendUrl;

    // Obtém o e-mail configurado para enviar as mensagens de recuperação.
    @Value("${spring.mail.username}")
    private String remetente;

    // Construtor responsável por receber os componentes necessários.
    // O Spring fornece os repositórios, o codificador de senha
    // e o serviço de e-mail quando cria esta classe.
    RecuperacaoSenhaService(
        UsuarioRepo usuarios,
        TokenRecuperacaoSenhaRepo tokens,
        PasswordEncoder encoder,
        JavaMailSender mailSender
    ) {
        // Guarda as dependências recebidas para utilizar nos métodos.
        this.usuarios = usuarios;
        this.tokens = tokens;
        this.encoder = encoder;
        this.mailSender = mailSender;
    }

    // Gera um hash SHA-256 a partir de um texto.
    // É utilizado para não armazenar o token original no banco de dados.
    // Recebe uma String e retorna o hash em formato hexadecimal.
    private String hash(String valor) {
        try {

            // Converte o texto para bytes utilizando UTF-8
            // e calcula o resumo criptográfico com SHA-256.
            byte[] bytes = MessageDigest.getInstance("SHA-256")
                .digest(valor.getBytes(StandardCharsets.UTF_8));

            // Transforma os bytes do hash em uma String hexadecimal.
            return HexFormat.of().formatHex(bytes);

        } catch (Exception e) {

            // Caso ocorra algum erro na geração do hash,
            // interrompe a operação e informa o problema.
            throw new IllegalStateException("Erro ao gerar hash", e);
        }
    }

    // Inicia a recuperação de senha utilizando o e-mail informado.
    // Procura a conta, gera um token temporário e envia o link por e-mail.
    void solicitar(String email) {

        // Remove espaços no início e no fim do e-mail.
        // Também converte as letras para minúsculas antes da consulta.
        var usuario = usuarios.findByEmail(
            email.trim().toLowerCase(java.util.Locale.ROOT)
        );

        // Se o e-mail não estiver cadastrado, encerra o método.
        // Isso evita informar diretamente se uma conta existe no sistema.
        if (usuario.isEmpty()) {
            return;
        }

        // Cria um espaço de 32 bytes para armazenar valores aleatórios.
        byte[] bytes = new byte[32];

        // Preenche os bytes com valores gerados de forma segura.
        random.nextBytes(bytes);

        // Converte os bytes em um token que pode ser utilizado em uma URL.
        // O withoutPadding remove os caracteres de preenchimento do Base64.
        String token = Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString(bytes);

        // Cria um registro de recuperação vinculado ao usuário.
        // Salva o hash do token e define a validade de 15 minutos.
        TokenRecuperacaoSenha registro =
            new TokenRecuperacaoSenha(
                usuario.get(),
                hash(token),
                LocalDateTime.now().plusMinutes(15)
            );

        // Armazena o registro de recuperação no banco de dados.
        tokens.save(registro);

        // Monta o endereço que será enviado ao usuário.
        // O token é colocado no link para identificar a recuperação.
        String link = frontendUrl
            + "/?recuperarToken=" + token;

        // Cria uma mensagem de e-mail simples, contendo apenas texto.
        SimpleMailMessage mensagem = new SimpleMailMessage();

        // Define o endereço responsável pelo envio.
        mensagem.setFrom(remetente);

        // Define o e-mail do usuário que solicitou a recuperação.
        mensagem.setTo(usuario.get().email);

        // Define o assunto apresentado na caixa de entrada.
        mensagem.setSubject("LaunchControl - Recuperação de senha");

        // Monta o conteúdo do e-mail com o nome do usuário,
        // o link de recuperação e o prazo de validade.
        mensagem.setText(
            "Olá, " + usuario.get().nome + "!\n\n"
            + "Recebemos uma solicitação para redefinir sua senha.\n\n"
            + "Acesse o link:\n" + link + "\n\n"
            + "Este link expira em 15 minutos.\n\n"
            + "Se você não solicitou, ignore este e-mail."
        );

        // Envia o e-mail utilizando as configurações do Spring Mail.
        mailSender.send(mensagem);
    }

    // Realiza a troca da senha depois que o usuário acessa o link.
    // Recebe o token de recuperação e a nova senha informada.
    // O @Transactional mantém as operações do banco na mesma transação.
    @Transactional
    void redefinir(String token, String novaSenha) {

        // Gera o hash do token recebido e procura seu registro no banco.
        // Se não encontrar, retorna um erro HTTP 400.
        TokenRecuperacaoSenha registro = tokens
            .findByTokenHash(hash(token))
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Link inválido ou expirado."
            ));

        // Verifica se o token já foi utilizado ou se passou da validade.
        // isAfter() confirma se o prazo ainda está no futuro.
        // Caso alguma condição seja inválida, a recuperação é bloqueada.
        if (registro.utilizado ||
            !registro.expiraEm.isAfter(LocalDateTime.now())) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Link inválido ou expirado."
            );
        }

        // Verifica se a nova senha foi informada corretamente.
        // A senha precisa ter pelo menos 8 caracteres.
        if (novaSenha == null || novaSenha.length() < 8) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "A senha deve ter pelo menos 8 caracteres."
            );
        }

        // Codifica a nova senha utilizando o PasswordEncoder.
        // Dessa forma, a senha original não é armazenada em texto puro.
        registro.usuario.senha = encoder.encode(novaSenha);

        // Salva o usuário com a senha atualizada no banco de dados.
        usuarios.save(registro.usuario);

        // Busca todos os tokens de recuperação ainda não utilizados
        // que pertencem ao mesmo usuário.
        for (TokenRecuperacaoSenha t :
            tokens.findByUsuarioIdAndUtilizadoFalse(registro.usuario.id)) {

            // Marca cada token como utilizado.
            // Isso impede que links antigos sejam reutilizados.
            t.utilizado = true;

            // Salva a alteração do token no banco de dados.
            tokens.save(t);
        }
    }
}
