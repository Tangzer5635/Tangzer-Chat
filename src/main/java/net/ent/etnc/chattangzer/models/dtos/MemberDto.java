package net.ent.etnc.chattangzer.models.dtos;

import net.ent.etnc.chattangzer.models.entities.MemberRole;
import net.ent.etnc.chattangzer.models.entities.Membership;

import java.time.Instant;

public record MemberDto(UserDto user, MemberRole role, Instant joinedAt) {

    public static MemberDto from(Membership membership) {
        return new MemberDto(UserDto.from(membership.getUser()), membership.getRole(), membership.getJoinedAt());
    }
}
