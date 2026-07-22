-- *********************************************************************
-- SQL to roll back currently unexecuted changes
-- *********************************************************************
-- Change Log: db/changelog/v1/docintel-changelog-full-release.xml
-- Ran at: 7/10/26, 5:04 PM
-- Against: DCT@jdbc:oracle:thin:@10.85.104.156:1521/egptsg
-- Liquibase version: 4.31.1
-- *********************************************************************

-- Lock Database
UPDATE DCT.DATABASECHANGELOGLOCK SET LOCKED = 1, LOCKEDBY = 'SGLUOB3011BNH (10.192.90.2)', LOCKGRANTED = SYSTIMESTAMP WHERE ID = 1 AND LOCKED = 0;

-- Rolling Back ChangeSet: db/changelog/scripts/v1.0.21-scripts.sql::Adding::utshab_ACN
DELETE FROM DCT.DATABASECHANGELOG WHERE ID = 'Adding' AND AUTHOR = 'utshab_ACN' AND FILENAME = 'db/changelog/scripts/v1.0.21-scripts.sql';

-- Release Database Lock
UPDATE DCT.DATABASECHANGELOGLOCK SET LOCKED = 0, LOCKEDBY = NULL, LOCKGRANTED = NULL WHERE ID = 1;