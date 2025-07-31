package com.wordle;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@SpringBootApplication
public class WordleApplication {
	public static void main(String[] args) {
		SpringApplication.run(WordleApplication.class, args);
	}

	@Bean
	public WebMvcConfigurer corsConfigurer() {
		return new WebMvcConfigurer() {
			@Override
			public void addCorsMappings(CorsRegistry registry) {
				registry.addMapping("/api/**")
								.allowedOriginPatterns("https://select-woodcock-lately.ngrok-free.app")
								.allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
								.allowedHeaders("*")
								.allowCredentials(true)
								.maxAge(3600);
			}
		};
	}
}
