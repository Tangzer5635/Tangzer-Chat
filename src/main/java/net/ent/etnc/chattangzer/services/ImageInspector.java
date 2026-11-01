package net.ent.etnc.chattangzer.services;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Iterator;

/**
 * Reconnaît une image à ses premiers octets (« nombre magique ») plutôt qu'à son
 * extension ou au type annoncé par le navigateur, qui peuvent mentir.
 */
public final class ImageInspector {

    private ImageInspector() {
    }

    public record Dimensions(int width, int height) {}

    /** Type MIME de l'image, ou null si ce n'est pas une image acceptée. */
    public static String detectType(byte[] header) {
        if (startsWith(header, 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A)) {
            return "image/png";
        }
        if (startsWith(header, 0xFF, 0xD8, 0xFF)) {
            return "image/jpeg";
        }
        if (startsWith(header, 'G', 'I', 'F', '8') && header.length > 5
                && (header[4] == '7' || header[4] == '9') && header[5] == 'a') {
            return "image/gif";
        }
        if (startsWith(header, 'R', 'I', 'F', 'F') && header.length >= 12
                && header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P') {
            return "image/webp";
        }
        return null;
    }

    /**
     * Largeur et hauteur lues dans l'en-tête de l'image (sans la décoder entièrement),
     * ou null si Java ne sait pas lire ce format (WEBP par exemple).
     */
    public static Dimensions readDimensions(byte[] content) {
        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(content))) {
            if (input == null) {
                return null;
            }
            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) {
                return null;
            }
            ImageReader reader = readers.next();
            try {
                reader.setInput(input, true, true);
                return new Dimensions(reader.getWidth(0), reader.getHeight(0));
            } finally {
                reader.dispose();
            }
        } catch (IOException | RuntimeException e) {
            return null;
        }
    }

    private static boolean startsWith(byte[] data, int... expected) {
        if (data.length < expected.length) {
            return false;
        }
        for (int i = 0; i < expected.length; i++) {
            if ((data[i] & 0xFF) != expected[i]) {
                return false;
            }
        }
        return true;
    }
}
