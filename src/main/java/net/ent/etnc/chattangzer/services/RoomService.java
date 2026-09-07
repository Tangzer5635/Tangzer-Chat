package net.ent.etnc.chattangzer.services;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RoomService {

    private final Map<String, Set<String>> rooms =
            new ConcurrentHashMap<>();

    public void addMember(String roomId, String username) {
        rooms.computeIfAbsent(roomId, key -> ConcurrentHashMap.newKeySet()).add(username);
    }

    public boolean isMember(String roomId, String username) {
        return rooms.getOrDefault(roomId, Set.of()).contains(username);
    }
}