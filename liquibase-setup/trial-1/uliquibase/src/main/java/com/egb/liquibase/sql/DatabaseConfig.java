package com.egb.liquibase.sql;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.AllArgsConstructor;
import oracle.jdbc.pool.OracleDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.util.Properties;

/**
 * Configuration class for database connections.
 *
 * @author Architecture and Engineering..
 */
@Configuration
@AllArgsConstructor
@SuppressWarnings("java:S2139")
public class DatabaseConfig {

    private static final Logger LOGGER = LoggerFactory.getLogger(DatabaseConfig.class);

    private final DBProperties dbProperties;
    private static final String ORACLE_NET_WALLET_LOCATION = "oracle.net.wallet_location";
    private static final String JDBC_ORACLE_THIN = "jdbc:oracle:thin:/@";

    /**
     * Creates a data source bean for Docintel database without wallet configuration.
     *
     * @return a data source instance
     */
    @ConditionalOnProperty(
            prefix = "docintel.db",
            name = "enable-db-wallet",
            havingValue = "false",
            matchIfMissing = true)
    @Bean
    public DataSource airDataSource() {
        HikariConfig hikariConfig = dbProperties.getDatasource().get("docintel");
        LOGGER.info("Creating Docintel data source without wallet configuration");
        return DataSourceBuilder.create().type(HikariDataSource.class)
                .driverClassName(hikariConfig.getDriverClassName())
                .url(hikariConfig.getJdbcUrl())
                .username(hikariConfig.getUsername())
                .password(hikariConfig.getPassword())
                .build();
    }

    /**
     * Creates a data source bean for EGP database with wallet configuration.
     *
     * @param hikariConfig the Hikari configuration
     * @return a data source instance
     * @throws SQLException if an error occurs while creating the data source
     */
    @ConditionalOnProperty(
            prefix = "docintel.db",
            name = "enable-db-wallet",
            havingValue = "true")
    @Bean
    public DataSource airWalletDataSource() throws SQLException {
        DBWalletConfig walletConfig = dbProperties.getDbWallet().get("docintel");
        LOGGER.info("Creating Docintel data source with wallet configuration");

        HikariConfig hikariConfig =
                dbProperties.getDatasource().get("docintel");

        return configureOracleDatasource(walletConfig, hikariConfig);
    }

    /**
     * Configures an Oracle data source using the provided wallet configuration and Hikari configuration.
     *
     * @param walletConfig the wallet configuration
     * @param hikariConfig the Hikari configuration
     * @return a data source instance
     * @throws SQLException if an error occurs while creating the data source
     */
    private DataSource configureOracleDatasource(
            DBWalletConfig walletConfig, HikariConfig hikariConfig) throws SQLException {
        try {
            hikariConfig.setUsername(null);
            hikariConfig.setPassword(null);
            OracleDataSource oracleDataSource = getOracleDataSource(walletConfig, hikariConfig);
            hikariConfig.setDataSource(oracleDataSource);
            return new HikariDataSource(hikariConfig);
        } catch (SQLException e) {
            LOGGER.error("Error creating Oracle data source", e);
            throw e;
        } catch (Exception e) {
            LOGGER.warn("Unexpected error creating Oracle data source", e);
            throw new SQLException("Unexpected error creating Oracle data source", e);
        }
    }

    /**
     * Fetch the oracle datsource
     * @param walletConfig
     * @param hikariConfig
     * @return
     * @throws SQLException
     */
    private static OracleDataSource getOracleDataSource(DBWalletConfig walletConfig, HikariConfig hikariConfig) throws SQLException {
        OracleDataSource oracleDataSource = new OracleDataSource();
        LOGGER.info("Wallet Location : {}", walletConfig.getWalletLocation());
        LOGGER.info("DB Alias        : {}", walletConfig.getDbAlias());
        Properties props = new Properties();
        props.put(
                ORACLE_NET_WALLET_LOCATION,
                "(source=(method=file)(method_data=(directory=" + walletConfig.getWalletLocation() + ")))");
        oracleDataSource.setConnectionProperties(props);
        oracleDataSource.setDriverType(hikariConfig.getDriverClassName());
        oracleDataSource.setURL(JDBC_ORACLE_THIN + walletConfig.getDbAlias());
        return oracleDataSource;
    }
}