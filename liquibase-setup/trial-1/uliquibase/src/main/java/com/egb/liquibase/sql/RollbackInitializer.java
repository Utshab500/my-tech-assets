package com.egb.liquibase.sql;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;

public class RollbackInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {
    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        System.setProperty("spring.liquibase.enabled","false");
        System.setProperty("in.rollback.mode","true");

    }
}