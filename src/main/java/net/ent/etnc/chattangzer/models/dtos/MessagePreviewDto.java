package net.ent.etnc.chattangzer.models.dtos;

/** Extrait du message auquel on répond. */
public record MessagePreviewDto(Long id, UserDto author, String content) {
}
