-- =============================================================
-- ORACLE TEST SCHEMA TEARDOWN
-- REVERSES EVERYTHING IN oracle_test_schema_setup.sql
-- RUN AS DBA (SYS OR SYSTEM)
-- =============================================================

-- -------------------------------------------------------------
-- 1. REVOKE TABLE PRIVILEGES FROM TEST_USER
-- -------------------------------------------------------------

REVOKE SELECT, INSERT, UPDATE, DELETE ON TEST_USER.EMPLOYEES   FROM TEST_USER;
REVOKE SELECT, INSERT, UPDATE, DELETE ON TEST_USER.DEPARTMENTS FROM TEST_USER;
REVOKE SELECT, INSERT, UPDATE, DELETE ON TEST_USER.PROJECTS    FROM TEST_USER;


-- -------------------------------------------------------------
-- 2. DROP DUMMY TABLES
--    ORDER MATTERS: PROJECTS REFERENCES DEPARTMENTS (FK)
-- -------------------------------------------------------------

DROP TABLE TEST_USER.PROJECTS    PURGE;
DROP TABLE TEST_USER.DEPARTMENTS PURGE;
DROP TABLE TEST_USER.EMPLOYEES   PURGE;


-- -------------------------------------------------------------
-- 3. DROP USER AND SCHEMA
--    CASCADE REMOVES ANY REMAINING OBJECTS OWNED BY TEST_USER
-- -------------------------------------------------------------

DROP USER TEST_USER CASCADE;


-- -------------------------------------------------------------
-- 4. DROP TEST TABLESPACE AND DATAFILE
-- -------------------------------------------------------------

DROP TABLESPACE TEST_TS
    INCLUDING CONTENTS AND DATAFILES
    CASCADE CONSTRAINTS;
