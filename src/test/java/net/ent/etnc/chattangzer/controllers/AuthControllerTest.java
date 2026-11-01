package net.ent.etnc.chattangzer.controllers;

import com.jayway.jsonpath.JsonPath;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private String register(String username, String password) throws Exception {
        String body = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username": "%s", "displayName": "Nom affiché", "password": "%s"}
                                """.formatted(username, password)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.username").value(username.toLowerCase()))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.token");
    }

    @Test
    void registerThenAccessProfileWithToken() throws Exception {
        String token = register("nouveau", "secret123");

        mockMvc.perform(get("/api/users/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("nouveau"))
                .andExpect(jsonPath("$.displayName").value("Nom affiché"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    void loginIsCaseInsensitiveOnUsername() throws Exception {
        register("casse", "secret123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\": \"CASSE\", \"password\": \"secret123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.username").value("casse"));
    }

    @Test
    void wrongPasswordGives401WithMessage() throws Exception {
        register("mauvais", "secret123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\": \"mauvais\", \"password\": \"nope\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Identifiant ou mot de passe incorrect"));
    }

    @Test
    void duplicateRegistrationGives409() throws Exception {
        register("doublon", "secret123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\": \"doublon\", \"password\": \"secret123\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Ce nom d'utilisateur est déjà pris"));
    }

    @Test
    void profileRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/users/me").header("Authorization", "Bearer pas-un-token"))
                .andExpect(status().isUnauthorized());
    }
}
