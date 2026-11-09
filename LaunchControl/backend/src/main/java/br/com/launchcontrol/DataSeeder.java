
package br.com.launchcontrol;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;

// Classe responsável por criar contas de teste quando o sistema inicia
@Configuration
@ConditionalOnProperty(name = "launchcontrol.demo-accounts", havingValue = "true")
class DataSeeder {

    // Executa o cadastro dos usuários de teste ao iniciar o Spring Boot
    @Bean
    CommandLineRunner seed(UsuarioRepo repo, PasswordEncoder encoder) {
        return args -> {

            // Conta para testar as funcionalidades do cliente
            criar(
                repo,
                encoder,
                "Cliente Teste",
                "cliente@launchcontrol.com",
                "Cliente@123",
                Perfil.CLIENTE
            );

            // Conta para testar as funcionalidades da oficina
            criar(
                repo,
                encoder,
                "Oficina Teste",
                "oficina@launchcontrol.com",
                "Oficina@123",
                Perfil.OFICINA
            );

            // Conta para testar o cadastro e gerenciamento de peças
            criar(
                repo,
                encoder,
                "Fornecedor Teste",
                "fornecedor@launchcontrol.com",
                "Fornecedor@123",
                Perfil.FORNECEDOR
            );

            // Conta para testar o acesso do administrador
            criar(
                repo,
                encoder,
                "Administrador Teste",
                "admin@launchcontrol.com",
                "Admin@123",
                Perfil.ADMINISTRADOR
            );
        };
    }

    // Verifica se o e-mail já está cadastrado antes de criar o usuário
    private void criar(
        UsuarioRepo r,
        PasswordEncoder e,
        String n,
        String email,
        String senha,
        Perfil p
    ) {

        // Evita criar contas repetidas no banco de dados
        if (r.findByEmail(email).isEmpty()) {

            // Criptografa a senha e salva o usuário com seu perfil
            r.save(
                new Usuario(
                    n,
                    email,
                    e.encode(senha),
                    p
                )
            );
        }
    }
}
