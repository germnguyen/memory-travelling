package com.travelling.memory;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.*;

@SpringBootApplication(
	exclude = {
		org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration.class,
		org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration.class
	}
)
public class MemoryApplication {

	public static void main(String[] args) {
		SpringApplication.run(MemoryApplication.class, args);
	}

}
