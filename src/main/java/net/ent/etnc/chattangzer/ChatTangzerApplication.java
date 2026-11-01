package net.ent.etnc.chattangzer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ChatTangzerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ChatTangzerApplication.class, args);
    }

}
