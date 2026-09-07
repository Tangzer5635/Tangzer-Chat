package net.ent.etnc.chattangzer.security;

import net.ent.etnc.chattangzer.security.jwt.JwtAuthFilter;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Configuration Spring Security — même pattern que Jurassic Park
 * + CORS activé pour le front React sur :5173.
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final UserDetailsService userDetailsService;

    @Autowired
    public SecurityConfig(UserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    /**
     * AuthenticationManager — même pattern que JP.
     */
    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity httpSecurity) {
        AuthenticationManagerBuilder builder =
                httpSecurity.getSharedObject(
                        AuthenticationManagerBuilder.class
                );
        builder.userDetailsService(userDetailsService);
        return builder.build();
    }

    /**
     * Configuration de la chaîne de filtres.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthFilter jwtAuthFilter) throws Exception {

        // CORS câblé explicitement vers le bean
        http.cors(cors -> cors.configurationSource(
                corsConfigurationSource()
        ));

        // CSRF désactivé (API REST + WebSocket)
        http.csrf(csrf -> csrf.disable());

        // Stateless : pas de session HTTP
        http.sessionManagement(s ->
                s.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
        );

        // Règles d'autorisation
        http.authorizeHttpRequests(auth -> auth

                .requestMatchers("/auth/**")
                .permitAll()

                .requestMatchers("/ws/**")
                .permitAll()

                .requestMatchers(HttpMethod.OPTIONS)
                .permitAll()

                .anyRequest()
                .authenticated()
        );

        // 401 pour token absent/invalide
        http.exceptionHandling(ex -> ex
                .authenticationEntryPoint(
                        (request, response, e) ->
                                response.sendError(401, "Non authentifié")
                )
        );

        // Filtre JWT avant le filtre username/password
        http.addFilterBefore(
                jwtAuthFilter,
                UsernamePasswordAuthenticationFilter.class
        );

        return http.build();
    }

    /**
     * Configuration CORS pour le front React.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(
                List.of("http://localhost",
                        "http://172.16.64.192")
        );

        configuration.setAllowedMethods(
                List.of("GET", "POST", "PUT", "DELETE", "OPTIONS")
        );

        configuration.setAllowedHeaders(List.of("*"));

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}