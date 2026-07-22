package com.egb.liquibase.sql;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.BadSqlGrammarException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.io.IOException;

@Slf4j
@Service
public class RollbackServiceExecution {

    private final JdbcTemplate jdbcTemplate;

    public RollbackServiceExecution(DataSource dataSource) {
        this.jdbcTemplate = new JdbcTemplate(dataSource);
    }

    @Transactional
    public void executeSqlFile() throws IOException {
        Resource resource = new ClassPathResource("db/changelog/v1/rollbackFile_docintel.sql");
        String sqlContent = new String(resource.getContentAsByteArray());

        String[] sqlQueries = sqlContent.split(";");
        for (String query : sqlQueries) {
            query = query.trim();
            if (!query.isEmpty()) {
                try {
                    jdbcTemplate.execute(query);
                }catch(BadSqlGrammarException e) {
                    log.error("Error Occurred during Rollback: ", e);
//                    if(!e.getMessage().contains("StatementCallback; bad SQL grammar [-- Create Database"))
//                        throw e;
                }
            }
        }
    }
}