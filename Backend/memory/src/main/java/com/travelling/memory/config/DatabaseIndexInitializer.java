package com.travelling.memory.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseIndexInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON locations USING GIST (coordinates);");
            log.info("PostGIS GIST index idx_locations_coordinates verified/created on locations(coordinates).");
        } catch (Exception e) {
            log.warn("Could not create PostGIS GIST index idx_locations_coordinates: {}", e.getMessage());
        }
    }
}
