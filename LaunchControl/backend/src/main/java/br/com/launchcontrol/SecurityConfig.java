
package br.com.launchcontrol;

import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.*;
import java.util.List;

// Classe responsável pelas configurações de segurança do LaunchControl.
// Define como os usuários são autenticados e quais requisições podem acessar o sistema.
@Configuration
class SecurityConfig {

    // Busca os dados do usuário no banco durante o processo de autenticação.
    // O Spring Security utiliza esse método para verificar as credenciais do login.
    @Bean
    UserDetailsService userDetailsService(UsuarioRepo repo) {

        // Recebe o e-mail informado pelo usuário e procura a conta cadastrada.
        return email -> {

            // Converte o e-mail para letras minúsculas antes de realizar a busca.
            // Caso a conta não exista, lança uma exceção informando que não foi encontrada.
            Usuario u = repo.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new UsernameNotFoundException("Conta não encontrada"));

            // Retorna os dados necessários para o Spring Security autenticar o usuário.
            // O ROLE_ identifica o perfil de acesso, como CLIENTE, OFICINA ou ADMINISTRADOR.
            return new org.springframework.security.core.userdetails.User(
                u.email,
                u.senha,
                List.of(new SimpleGrantedAuthority("ROLE_" + u.perfil.name()))
            );
        };
    }

    // Define o algoritmo utilizado para codificar e verificar as senhas.
    // O BCrypt gera um hash da senha, evitando armazená-la em texto puro.
    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Configura as regras de segurança das requisições HTTP.
    // Define quais páginas são públicas e quais exigem autenticação.
    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        return http

            // Desativa a proteção CSRF nesta configuração.
            // Essa proteção normalmente é utilizada contra requisições
            // indevidas feitas a partir de sessões autenticadas.
            .csrf(c -> c.disable())

            // Habilita o uso das regras de CORS definidas abaixo.
            // Permite controlar a comunicação entre diferentes origens.
            .cors(Customizer.withDefaults())

            // Inicia a configuração das permissões de acesso.
            .authorizeHttpRequests(a -> a

                // Libera o acesso aos arquivos principais do frontend.
                // Também permite acessar as rotas públicas da API
                // sem precisar estar autenticado.
                .requestMatchers(
                    "/",
                    "/index.html",
                    "/style.css",
                    "/script.js",
                    "/qrcode.js",
                    "/app.js",
                    "/api/public/**",
                    "/error"
                ).permitAll()

                // Libera requisições OPTIONS, utilizadas pelo navegador
                // para verificar permissões antes de algumas chamadas à API.
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Exige autenticação para qualquer outra requisição.
                .anyRequest().authenticated()
            )

            // Utiliza autenticação HTTP Basic.
            // O navegador ou frontend envia as credenciais
            // no cabeçalho Authorization das requisições.
            .httpBasic(Customizer.withDefaults())

            // Finaliza a configuração e cria a cadeia de filtros de segurança.
            .build();
    }

    // Configura quais origens podem acessar a API pelo navegador.
    // Essas regras são importantes durante o desenvolvimento local.
    @Bean
    CorsConfigurationSource corsConfigurationSource() {

        // Cria o objeto que armazenará as permissões de CORS.
        CorsConfiguration c = new CorsConfiguration();

        // Permite requisições originadas do localhost e do 127.0.0.1.
        // O asterisco permite utilizar diferentes portas locais.
        c.setAllowedOriginPatterns(
            List.of(
                "http://localhost:*",
                "http://127.0.0.1:*"
            )
        );

        // Define os métodos HTTP que o frontend pode utilizar.
        // GET consulta, POST envia, PUT atualiza e DELETE remove dados.
        // OPTIONS é utilizado nas verificações de permissão do navegador.
        c.setAllowedMethods(
            List.of("GET", "POST", "PUT", "DELETE", "OPTIONS")
        );

        // Permite os cabeçalhos necessários para autenticação
        // e envio de informações no formato utilizado pela API.
        c.setAllowedHeaders(
            List.of("Authorization", "Content-Type")
        );

        // Permite requisições CORS com credenciais.
        c.setAllowCredentials(true);

        // Cria o responsável por aplicar as configurações de CORS.
        UrlBasedCorsConfigurationSource s =
            new UrlBasedCorsConfigurationSource();

        // Aplica as permissões configuradas a todas as rotas do sistema.
        s.registerCorsConfiguration("/**", c);

        // Retorna a configuração para ser utilizada pelo Spring Security.
        return s;
    }
}
