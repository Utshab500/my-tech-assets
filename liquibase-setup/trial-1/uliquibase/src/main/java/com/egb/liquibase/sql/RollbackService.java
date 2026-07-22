package com.egb.liquibase.sql;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
@ConditionalOnProperty(name="in.rollback.mode", havingValue = "true", matchIfMissing = false)
public class RollbackService {

    RollbackServiceExecution rollbackServiceExecution;

    @Autowired
    public RollbackService(RollbackServiceExecution rollbackServiceExecution) {
        this.rollbackServiceExecution = rollbackServiceExecution;
    }

    @PostConstruct
    public void init() throws IOException {
        rollbackServiceExecution.executeSqlFile();
    }

}