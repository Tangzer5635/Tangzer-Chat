package net.ent.etnc.chattangzer.security;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Override
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {

        if ("admin".equals(username)) {

            return User.builder()
                    .username("admin")
                    .password("{noop}admin")
                    .roles("USER")
                    .build();
        }

        if ("user".equals(username)) {
            return User.builder()
                    .username("user")
                    .password("{noop}user")
                    .roles("USER")
                    .build();
        }

        if ("tanguy".equals(username)) {
            return User.builder()
                    .username("tanguy")
                    .password("{noop}1234")
                    .roles("USER")
                    .build();
        }

        if ("pigloo".equals(username)) {
            return User.builder()
                    .username("pigloo")
                    .password("{noop}127845")
                    .roles("USER")
                    .build();
        }

        throw new UsernameNotFoundException(
                "Utilisateur introuvable : " + username
        );
    }
}