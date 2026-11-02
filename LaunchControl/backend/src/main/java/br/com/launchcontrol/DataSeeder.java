package br.com.launchcontrol;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
@Configuration
@ConditionalOnProperty(name="launchcontrol.demo-accounts",havingValue="true")
class DataSeeder {
 @Bean CommandLineRunner seed(UsuarioRepo repo,PasswordEncoder encoder){
  return args->{
   criar(repo,encoder,"Cliente Teste","cliente@launchcontrol.com","Cliente@123",Perfil.CLIENTE);
   criar(repo,encoder,"Oficina Teste","oficina@launchcontrol.com","Oficina@123",Perfil.OFICINA);
   criar(repo,encoder,"Fornecedor Teste","fornecedor@launchcontrol.com","Fornecedor@123",Perfil.FORNECEDOR);
   criar(repo,encoder,"Administrador Teste","admin@launchcontrol.com","Admin@123",Perfil.ADMINISTRADOR);
  };
 }
 private void criar(UsuarioRepo r,PasswordEncoder e,String n,String email,String senha,Perfil p){if(r.findByEmail(email).isEmpty())r.save(new Usuario(n,email,e.encode(senha),p));}
}
