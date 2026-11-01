package net.ent.etnc.chattangzer.models.dtos;

import java.util.List;

/** Une réaction et la liste des utilisateurs qui l'ont mise. */
public record ReactionDto(String emoji, List<Long> userIds) {
}
