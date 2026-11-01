package net.ent.etnc.chattangzer.controllers;

import net.ent.etnc.chattangzer.exceptions.ApiException;
import net.ent.etnc.chattangzer.models.dtos.AttachmentDto;
import net.ent.etnc.chattangzer.models.entities.Attachment;
import net.ent.etnc.chattangzer.security.AuthUser;
import net.ent.etnc.chattangzer.services.AttachmentService;
import net.ent.etnc.chattangzer.services.StorageService;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * POST /api/attachments (multipart, champ « file »)  → {id, url, …}
 * GET  /api/attachments/{id}                          → l'image
 *
 * La lecture ne demande pas de token (une balise <img> ne sait pas en envoyer) :
 * l'adresse contient un UUID aléatoire impossible à deviner, comme sur Discord.
 */
@RestController
@RequestMapping("/api/attachments")
public class AttachmentController {

    private final AttachmentService attachmentService;
    private final StorageService storage;

    public AttachmentController(AttachmentService attachmentService, StorageService storage) {
        this.attachmentService = attachmentService;
        this.storage = storage;
    }

    @PostMapping
    public ResponseEntity<AttachmentDto> upload(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal AuthUser me
    ) throws IOException {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("Aucun fichier reçu");
        }
        AttachmentDto dto = attachmentService.upload(me.id(), file.getOriginalFilename(), file.getBytes());
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resource> download(@PathVariable String id) {
        Attachment attachment = attachmentService.get(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(attachment.getContentType()))
                .contentLength(attachment.getSize())
                // Le contenu d'un identifiant ne change jamais : cache d'un an.
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline()
                        .filename(attachment.getFileName(), StandardCharsets.UTF_8).build().toString())
                .header("X-Content-Type-Options", "nosniff")
                .body(new FileSystemResource(storage.pathOf(attachment.getId())));
    }
}
