package com.egb.liquibase.sql;

import com.zaxxer.hikari.HikariConfig;
import java.util.Map;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "docintel.db")
@Getter
@Setter
public class DBProperties {
    private Map<String, HikariConfig> datasource;
    private Map<String, DBWalletConfig> dbWallet;
}