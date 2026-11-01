package net.ent.etnc.chattangzer.config;

import net.ent.etnc.chattangzer.security.StompSubscriptionGuard;
import net.ent.etnc.chattangzer.security.jwt.JwtChannelInterceptor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;

/**
 * STOMP sur WebSocket natif (endpoint /ws).
 *
 * L'authentification ne repose pas sur un cookie mais sur le JWT envoyé
 * dans la trame CONNECT : les origines autorisées sont donc configurables
 * (variable ALLOWED_ORIGINS) sans risque de détournement de session.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtChannelInterceptor jwtChannelInterceptor;
    private final StompSubscriptionGuard subscriptionGuard;
    private final List<String> allowedOrigins;

    public WebSocketConfig(
            JwtChannelInterceptor jwtChannelInterceptor,
            StompSubscriptionGuard subscriptionGuard,
            @Value("${app.allowed-origins}") List<String> allowedOrigins
    ) {
        this.jwtChannelInterceptor = jwtChannelInterceptor;
        this.subscriptionGuard = subscriptionGuard;
        this.allowedOrigins = allowedOrigins;
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // 1. authentifie la connexion, 2. vérifie chaque abonnement.
        registration.interceptors(jwtChannelInterceptor, subscriptionGuard);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry
                .addEndpoint("/ws")
                .setAllowedOriginPatterns(allowedOrigins.toArray(String[]::new));
    }
}
