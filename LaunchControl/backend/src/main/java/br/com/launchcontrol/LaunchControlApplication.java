
package br.com.launchcontrol;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// Indica que esta é a classe principal do LaunchControl.
// O Spring Boot utiliza essa anotação para carregar as configurações
// e identificar os componentes necessários para o funcionamento do sistema.
@SpringBootApplication
public class LaunchControlApplication {

    // Método principal do Java, responsável por iniciar a aplicação.
    // O public permite seu acesso, o static permite executá-lo sem criar
    // um objeto da classe e o void indica que não retorna nenhum valor.
    // O String[] args recebe possíveis argumentos passados na inicialização.
    public static void main(String[] args) {

        // Inicia o Spring Boot e carrega os componentes do projeto.
        // Também inicia o servidor web, permitindo que o backend
        // receba as requisições enviadas pelo frontend.
        SpringApplication.run(LaunchControlApplication.class, args);
    }
}
