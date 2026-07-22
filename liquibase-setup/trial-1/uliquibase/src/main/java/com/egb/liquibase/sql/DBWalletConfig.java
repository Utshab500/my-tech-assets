package com.egb.liquibase.sql;

import lombok.Data;

@Data
public class DBWalletConfig {
    private boolean enableDbWallet;
    private String walletLocation;
    private String dbAlias;
}