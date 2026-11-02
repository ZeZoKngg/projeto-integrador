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
@Configuration
class SecurityConfig {
 @Bean UserDetailsService userDetailsService(UsuarioRepo repo){return email->{Usuario u=repo.findByEmail(email.toLowerCase()).orElseThrow(()->new UsernameNotFoundException("Conta não encontrada"));return new org.springframework.security.core.userdetails.User(u.email,u.senha,List.of(new SimpleGrantedAuthority("ROLE_"+u.perfil.name())));};}
 @Bean PasswordEncoder passwordEncoder(){return new BCryptPasswordEncoder();}
 @Bean SecurityFilterChain filterChain(HttpSecurity http)throws Exception{
  return http.csrf(c->c.disable()).cors(Customizer.withDefaults())
   .authorizeHttpRequests(a->a.requestMatchers("/","/index.html","/style.css","/script.js","/qrcode.js","/app.js","/api/public/**","/error").permitAll()
   .requestMatchers(HttpMethod.OPTIONS,"/**").permitAll().anyRequest().authenticated())
   .httpBasic(Customizer.withDefaults()).build();
 }
 @Bean CorsConfigurationSource corsConfigurationSource(){
  CorsConfiguration c=new CorsConfiguration();c.setAllowedOriginPatterns(List.of("http://localhost:*","http://127.0.0.1:*"));c.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));c.setAllowedHeaders(List.of("Authorization","Content-Type"));c.setAllowCredentials(true);
  UrlBasedCorsConfigurationSource s=new UrlBasedCorsConfigurationSource();s.registerCorsConfiguration("/**",c);return s;
 }
}
