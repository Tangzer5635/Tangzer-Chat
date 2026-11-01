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

import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ServerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private String register(String username) throws Exception {
        String body = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\": \"" + username + "\", \"password\": \"secret123\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return "Bearer " + JsonPath.read(body, "$.token");
    }

    @Test
    void newUserLandsOnTheDefaultPublicServer() throws Exception {
        String token = register("arrivant");

        mockMvc.perform(get("/api/servers").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Tangzer"))
                .andExpect(jsonPath("$[0].isDefault").value(true))
                .andExpect(jsonPath("$[0].isPublic").value(true))
                .andExpect(jsonPath("$[0].channels[0].name").value("général"));
    }

    @Test
    void createInviteThenJoinWithAnotherAccount() throws Exception {
        String owner = register("proprio");
        String friend = register("copain");

        String server = mockMvc.perform(post("/api/servers")
                        .header("Authorization", owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"Mon serveur\", \"icon\": \"🚀\", \"isPublic\": false}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.myRole").value("OWNER"))
                .andReturn().getResponse().getContentAsString();
        Integer serverId = JsonPath.read(server, "$.id");

        String invite = mockMvc.perform(post("/api/servers/" + serverId + "/invites")
                        .header("Authorization", owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"maxUses\": 5}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String code = JsonPath.read(invite, "$.code");

        mockMvc.perform(get("/api/servers/" + serverId).header("Authorization", friend))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Tu n'es pas membre de ce serveur"));

        mockMvc.perform(post("/api/invites/" + code + "/accept").header("Authorization", friend))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Mon serveur"))
                .andExpect(jsonPath("$.memberCount").value(2));

        mockMvc.perform(get("/api/servers/" + serverId + "/members").header("Authorization", owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].user.username", hasItem("copain")));
    }
}
