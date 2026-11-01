package net.ent.etnc.chattangzer.controllers;

import com.jayway.jsonpath.JsonPath;
import net.ent.etnc.chattangzer.support.TestImages;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AttachmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private String token() throws Exception {
        String body = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\": \"photographe\", \"password\": \"secret123\"}"))
                .andReturn().getResponse().getContentAsString();
        return "Bearer " + JsonPath.read(body, "$.token");
    }

    @Test
    void uploadThenDownloadWithoutToken() throws Exception {
        byte[] png = TestImages.png(32, 16);
        MockMultipartFile file = new MockMultipartFile("file", "chat.png", "image/png", png);

        String body = mockMvc.perform(multipart("/api/attachments").file(file).header("Authorization", token()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.width").value(32))
                .andExpect(jsonPath("$.height").value(16))
                .andReturn().getResponse().getContentAsString();
        String url = JsonPath.read(body, "$.url");

        mockMvc.perform(get(url))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "image/png"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(content().bytes(png));
    }

    @Test
    void uploadRequiresAnAccount() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "chat.png", "image/png", TestImages.png(4, 4));

        mockMvc.perform(multipart("/api/attachments").file(file))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void textDisguisedAsImageIsRefused() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "virus.png", "image/png", "<script>".getBytes());

        mockMvc.perform(multipart("/api/attachments").file(file).header("Authorization", token()))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.message").value("Seules les images PNG, JPEG, GIF et WEBP sont acceptées"));
    }

    @Test
    void unknownImageGives404() throws Exception {
        mockMvc.perform(get("/api/attachments/00000000-0000-0000-0000-000000000000"))
                .andExpect(status().isNotFound());
    }
}
