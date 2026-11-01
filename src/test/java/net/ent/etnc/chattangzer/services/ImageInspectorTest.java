package net.ent.etnc.chattangzer.services;

import net.ent.etnc.chattangzer.support.TestImages;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class ImageInspectorTest {

    @Test
    void recognizesImagesByTheirFirstBytes() {
        assertThat(ImageInspector.detectType(TestImages.png(4, 4))).isEqualTo("image/png");
        assertThat(ImageInspector.detectType(TestImages.image("jpg", 4, 4))).isEqualTo("image/jpeg");
        assertThat(ImageInspector.detectType(TestImages.image("gif", 4, 4))).isEqualTo("image/gif");
        assertThat(ImageInspector.detectType("RIFF\0\0\0\0WEBPVP8 ".getBytes(StandardCharsets.ISO_8859_1)))
                .isEqualTo("image/webp");
    }

    @Test
    void rejectsAnythingElseEvenWithAnImageName() {
        assertThat(ImageInspector.detectType("<script>alert(1)</script>".getBytes(StandardCharsets.UTF_8))).isNull();
        assertThat(ImageInspector.detectType("MZ\u0090\0".getBytes(StandardCharsets.ISO_8859_1))).isNull();
        assertThat(ImageInspector.detectType(new byte[0])).isNull();
    }

    @Test
    void readsDimensionsWithoutDecodingTheWholeImage() {
        assertThat(ImageInspector.readDimensions(TestImages.png(320, 200)))
                .isEqualTo(new ImageInspector.Dimensions(320, 200));
        assertThat(ImageInspector.readDimensions("pas une image".getBytes(StandardCharsets.UTF_8))).isNull();
    }
}
