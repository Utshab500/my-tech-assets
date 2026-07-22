--liquibase formatted sql
--changeset utshab_ACN:file_upload
--preconditions onError:HALT

-- DDL: FILE_UPLOAD
-- One row per physical file uploaded to the system.
-- FILE_PATH stores the absolute path to the file on disk (permanent storage).
-- FILE_METADATA stores screener output (page count, per-page types,
-- image dimensions, table/image counts) as CLOB IS JSON for Oracle 19C.
--
-- Schema prefix: set SCHEMA_PREFIX before running (see 00_run_all.sql).
-- Default is "" (no prefix) when run as the table owner.

CREATE TABLE ${schema}.FILE_UPLOAD (
                                       FILE_ID          VARCHAR2(36)    NOT NULL,
                                       FILE_NAME        VARCHAR2(512)   NOT NULL,
                                       FILE_TYPE        VARCHAR2(20)    NOT NULL,  -- pdf, png, jpg, docx, xlsx, txt, csv, ...
                                       FILE_SIZE_BYTES  NUMBER,
                                       FILE_HASH        VARCHAR2(64),              -- SHA-256 hex digest
                                       MIME_TYPE        VARCHAR2(100),
                                       FILE_PATH        VARCHAR2(1024),            -- absolute path to file on disk
                                       FILE_METADATA    CLOB            CHECK (FILE_METADATA IS JSON),
                                       USER_ID          VARCHAR2(50)    DEFAULT 'vensrz' NOT NULL,
                                       CLIENT_NAME      VARCHAR2(200)   NOT NULL,
                                       UPLOADED_AT      TIMESTAMP       DEFAULT SYSTIMESTAMP NOT NULL,
                                       CONSTRAINT pk_file_upload PRIMARY KEY (FILE_ID)
);

COMMENT ON TABLE  ${schema}.FILE_UPLOAD                IS 'One row per physical uploaded file';
COMMENT ON COLUMN ${schema}.FILE_UPLOAD.FILE_ID        IS 'UUID primary key';
COMMENT ON COLUMN ${schema}.FILE_UPLOAD.FILE_NAME      IS 'Original filename as supplied by user';
COMMENT ON COLUMN ${schema}.FILE_UPLOAD.FILE_TYPE      IS 'Extension-derived type: pdf, png, docx, etc.';
COMMENT ON COLUMN ${schema}.FILE_UPLOAD.FILE_HASH      IS 'SHA-256 hex digest used for deduplication';
COMMENT ON COLUMN ${schema}.FILE_UPLOAD.FILE_PATH      IS 'Absolute path to the uploaded file on disk';
COMMENT ON COLUMN ${schema}.FILE_UPLOAD.FILE_METADATA  IS 'Screener output: page_count, per-page types, image dims, table counts';
COMMENT ON COLUMN ${schema}.FILE_UPLOAD.USER_ID        IS 'Uploader user-ID; defaults to vensrz until auth is implemented';
COMMENT ON COLUMN ${schema}.FILE_UPLOAD.CLIENT_NAME    IS 'Owning client application (mTLS cert CN or X-Client-Name header). Enforces cross-app ownership isolation.';

CREATE INDEX idx_fu_hash      ON ${schema}.FILE_UPLOAD (FILE_HASH);
CREATE INDEX idx_fu_type      ON ${schema}.FILE_UPLOAD (FILE_TYPE);
CREATE INDEX idx_fu_uploaded  ON ${schema}.FILE_UPLOAD (UPLOADED_AT DESC);
CREATE INDEX idx_fu_user      ON ${schema}.FILE_UPLOAD (USER_ID);
CREATE INDEX idx_fu_client    ON ${schema}.FILE_UPLOAD (CLIENT_NAME);

--rollback DROP TABLE ${schema}.FILE_UPLOAD CASCADE CONSTRAINTS;