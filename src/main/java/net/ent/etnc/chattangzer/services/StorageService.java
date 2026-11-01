package net.ent.etnc.chattangzer.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Pattern;
import java.util.stream.Stream;

/**
 * Stockage des fichiers sur le disque, dans le dossier STORAGE_DIR
 * (un volume Docker en production). Un fichier = son identifiant.
 */
@Service
public class StorageService {

    private static final Pattern SAFE_ID = Pattern.compile("^[0-9a-f-]{36}$");

    private final Path root;

    public StorageService(@Value("${app.storage.dir}") String directory) {
        this.root = Path.of(directory).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new UncheckedIOException("Impossible de créer le dossier de stockage " + root, e);
        }
    }

    public void save(String id, byte[] content) {
        try {
            Files.write(pathOf(id), content);
        } catch (IOException e) {
            throw new UncheckedIOException("Échec de l'enregistrement du fichier", e);
        }
    }

    public Path pathOf(String id) {
        // L'identifiant est un UUID : impossible de sortir du dossier avec « ../ ».
        if (id == null || !SAFE_ID.matcher(id).matches()) {
            throw new IllegalArgumentException("Identifiant de fichier invalide");
        }
        return root.resolve(id);
    }

    public boolean exists(String id) {
        return Files.exists(pathOf(id));
    }

    public void delete(String id) {
        try {
            Files.deleteIfExists(pathOf(id));
        } catch (IOException e) {
            // Un fichier qui résiste sera retiré au prochain nettoyage.
        }
    }

    /** Identifiants de tous les fichiers présents sur le disque. */
    public Stream<String> listIds() {
        try {
            return Files.list(root)
                    .map(path -> path.getFileName().toString())
                    .filter(name -> SAFE_ID.matcher(name).matches());
        } catch (IOException e) {
            return Stream.empty();
        }
    }
}
