package net.ent.etnc.chattangzer.models.dtos;

import net.ent.etnc.chattangzer.models.entities.Attachment;

/** Photo telle qu'affichée par le front ; {@code url} se charge sans authentification. */
public record AttachmentDto(
        String id,
        String url,
        String fileName,
        String contentType,
        long size,
        Integer width,
        Integer height
) {

    public static AttachmentDto from(Attachment attachment) {
        return new AttachmentDto(
                attachment.getId(),
                "/api/attachments/" + attachment.getId(),
                attachment.getFileName(),
                attachment.getContentType(),
                attachment.getSize(),
                attachment.getWidth(),
                attachment.getHeight());
    }
}
