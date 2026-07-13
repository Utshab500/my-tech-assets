# Liquibase Setup with Spring Boot

A step-by-step guide to integrating Liquibase database change management into a Java Spring Boot project using formatted SQL changelogs.

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Java JDK | 17 or later | `java -version` to verify |
| Maven or Gradle | Maven 3.8+ / Gradle 8+ | Build tool of your choice |
| Spring Boot | 3.x | Liquibase auto-configuration included |
| Oracle Database | 12c or later | Or any supported RDBMS |
| IDE | IntelliJ / VS Code | VS Code requires Java Extension Pack |

---

## 1. Add Liquibase Dependency

### Maven — `pom.xml`

```xml
<!-- Liquibase Core -->
<dependency>
    <groupId>org.liquibase</groupId>
    <artifactId>liquibase-core</artifactId>
</dependency>

<!-- Oracle JDBC Driver -->
<dependency>
    <groupId>com.oracle.database.jdbc</groupId>
    <artifactId>ojdbc11</artifactId>
    <scope>runtime</scope>
</dependency>
```

### Gradle — `build.gradle`

```groovy
implementation 'org.liquibase:liquibase-core'
runtimeOnly 'com.oracle.database.jdbc:ojdbc11'
```

> Spring Boot manages the Liquibase version automatically via its BOM — no explicit version needed.

---

## 2. Configure Database Connection

Add the following to `src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:oracle:thin:@localhost:1521/FREEPDB1
    username: TEST_USER
    password: TestPass#2024
    driver-class-name: oracle.jdbc.OracleDriver

  liquibase:
    enabled: true
    change-log: classpath:db/changelog/db.changelog-master.sql
    default-schema: TEST_USER
```

> Replace `url`, `username`, and `password` with your actual database connection details.

---

## 3. Create the Changelog Directory Structure

Create the following directory layout inside `src/main/resources`:

```
src/main/resources/
└── db/
    └── changelog/
        ├── db.changelog-master.sql       -- Master file — includes all changelogs
        └── changes/
            ├── 001-create-employees.sql
            ├── 002-create-departments.sql
            └── 003-create-projects.sql
```

---

## 4. Create the Master Changelog

`src/main/resources/db/changelog/db.changelog-master.sql`

```sql
--liquibase formatted sql

--include file:db/changelog/changes/001-create-employees.sql
--include file:db/changelog/changes/002-create-departments.sql
--include file:db/changelog/changes/003-create-projects.sql
```

> The `--liquibase formatted sql` header is required on the first line of every Liquibase SQL file.

---

## 5. Create Changeset Files

Each SQL changeset file follows this structure:

```
--liquibase formatted sql

--changeset author:id
<SQL statements>
--rollback <reverse SQL statements>
```

---

### `001-create-employees.sql`

```sql
--liquibase formatted sql

--changeset test_user:001
CREATE TABLE TEST_USER.EMPLOYEES (
    EMPLOYEE_ID   NUMBER(10)    GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    FIRST_NAME    VARCHAR2(50)  NOT NULL,
    LAST_NAME     VARCHAR2(50)  NOT NULL,
    EMAIL         VARCHAR2(100) UNIQUE NOT NULL,
    HIRE_DATE     DATE          DEFAULT SYSDATE NOT NULL,
    SALARY        NUMBER(10, 2),
    IS_ACTIVE     CHAR(1)       DEFAULT 'Y' CHECK (IS_ACTIVE IN ('Y', 'N')),
    CREATED_AT    TIMESTAMP     DEFAULT SYSTIMESTAMP
);
--rollback DROP TABLE TEST_USER.EMPLOYEES;
```

---

### `002-create-departments.sql`

```sql
--liquibase formatted sql

--changeset test_user:002
CREATE TABLE TEST_USER.DEPARTMENTS (
    DEPARTMENT_ID   NUMBER(10)    GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    DEPARTMENT_NAME VARCHAR2(100) NOT NULL,
    LOCATION        VARCHAR2(200),
    MANAGER_ID      NUMBER(10),
    CREATED_AT      TIMESTAMP     DEFAULT SYSTIMESTAMP
);
--rollback DROP TABLE TEST_USER.DEPARTMENTS;
```

---

### `003-create-projects.sql`

```sql
--liquibase formatted sql

--changeset test_user:003
CREATE TABLE TEST_USER.PROJECTS (
    PROJECT_ID    NUMBER(10)    GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    PROJECT_NAME  VARCHAR2(150) NOT NULL,
    DEPARTMENT_ID NUMBER(10),
    START_DATE    DATE,
    END_DATE      DATE,
    BUDGET        NUMBER(15, 2),
    STATUS        VARCHAR2(20)  DEFAULT 'PLANNED'
                                CHECK (STATUS IN ('PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED')),
    CREATED_AT    TIMESTAMP     DEFAULT SYSTIMESTAMP
);

ALTER TABLE TEST_USER.PROJECTS
    ADD CONSTRAINT FK_PROJECTS_DEPT
    FOREIGN KEY (DEPARTMENT_ID)
    REFERENCES TEST_USER.DEPARTMENTS (DEPARTMENT_ID);
--rollback DROP TABLE TEST_USER.PROJECTS;
```

---

## 6. Run the Application

When the Spring Boot application starts, Liquibase will automatically detect and apply any pending changesets.

```bash
# Maven
./mvnw spring-boot:run

# Gradle
./gradlew bootRun
```

On startup you should see log output similar to:

```
INFO  liquibase : Successfully acquired change log lock
INFO  liquibase : Running Changeset: db/changelog/changes/001-create-employees.sql::001::test_user
INFO  liquibase : Running Changeset: db/changelog/changes/002-create-departments.sql::002::test_user
INFO  liquibase : Running Changeset: db/changelog/changes/003-create-projects.sql::003::test_user
INFO  liquibase : Successfully released change log lock
```

---

## 7. How Liquibase Tracks Changes

Liquibase creates two control tables automatically in your schema on first run:

| Table | Purpose |
|---|---|
| `DATABASECHANGELOG` | Records every changeset that has been applied (id, author, filename, checksum, date) |
| `DATABASECHANGELOGLOCK` | Prevents concurrent Liquibase runs from conflicting |

A changeset is **only applied once**. Liquibase matches each entry by `id` + `author` + `filename`. Once recorded in `DATABASECHANGELOG`, it is never re-run.

---

## 8. Rolling Back Changes

### Roll back the last N changesets

```bash
./mvnw liquibase:rollback -Dliquibase.rollbackCount=1
```

### Roll back to a specific tag

```bash
# First tag a point in time
./mvnw liquibase:tag -Dliquibase.tag=v1.0

# Later roll back to that tag
./mvnw liquibase:rollback -Dliquibase.rollbackTag=v1.0
```

> Rollback requires a `--rollback` comment in each changeset with the reverse SQL. For `CREATE TABLE` this is simply `DROP TABLE`.

---

## Key Concepts

| Concept | Description |
|---|---|
| **Changeset** | A single atomic unit of change identified by `author:id` |
| **Changelog** | A `.sql` file containing one or more changesets with Liquibase header comments |
| **Master changelog** | The root file that includes all other changelogs in order |
| **Checksum** | A hash Liquibase computes per changeset — modifying an already-applied changeset will cause a startup error |
| **`--rollback`** | Inline SQL comment that tells Liquibase how to reverse the changeset |
