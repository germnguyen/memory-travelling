package com.travelling.memory;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class DatabaseConnectionTest {

    @Autowired
    private DataSource dataSource;

    @Test
    void testConnectionAndPostGISVersion() throws Exception {
        assertThat(dataSource).isNotNull();
        try (Connection connection = dataSource.getConnection()) {
            assertThat(connection.isValid(2)).isTrue();
            try (Statement statement = connection.createStatement()) {
                ResultSet rs = statement.executeQuery("SELECT PostGIS_Version();");
                assertThat(rs.next()).isTrue();
                String version = rs.getString(1);
                assertThat(version).contains("3.4");
            }
        }
    }
}

