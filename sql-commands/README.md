# SQL Commands

A collection of Oracle SQL scripts for learning and reference.

---

## oracle_test_schema_setup.sql

A self-contained Oracle SQL script that provisions a complete test environment from scratch. Run it as a DBA (`SYS` or `SYSTEM`) against any Oracle Database instance.

### What it does

The script is divided into four sequential steps:

#### 1. Create Test Schema (Tablespace)

Creates a dedicated tablespace `TEST_TS` that acts as the physical storage layer for the test schema.

| Property | Value |
|---|---|
| Tablespace name | `TEST_TS` |
| Datafile | `TEST_TS.DBF` |
| Initial size | 50 MB |
| Auto-extend increment | 10 MB |
| Max size | 200 MB |

> In Oracle, a schema is implicitly created alongside its user — `TEST_USER` and `TEST_TS` together form the test schema.

---

#### 2. Create User

Creates the `TEST_USER` account mapped to the `TEST_TS` tablespace with unlimited quota.

**System privileges granted to `TEST_USER`:**

| Privilege | Purpose |
|---|---|
| `CREATE SESSION` | Allows the user to connect to the database |
| `CREATE TABLE` | Allows creating tables within the schema |
| `CREATE VIEW` | Allows creating views |
| `CREATE SEQUENCE` | Allows creating sequences |

---

#### 3. Create Dummy Tables

Creates three tables under the `TEST_USER` schema to simulate a basic organisational data model.

**`TEST_USER.EMPLOYEES`**

| Column | Type | Notes |
|---|---|---|
| `EMPLOYEE_ID` | `NUMBER(10)` | Primary key, auto-generated identity |
| `FIRST_NAME` | `VARCHAR2(50)` | Not null |
| `LAST_NAME` | `VARCHAR2(50)` | Not null |
| `EMAIL` | `VARCHAR2(100)` | Unique, not null |
| `HIRE_DATE` | `DATE` | Defaults to `SYSDATE` |
| `SALARY` | `NUMBER(10,2)` | Optional |
| `IS_ACTIVE` | `CHAR(1)` | `Y` or `N`, defaults to `Y` |
| `CREATED_AT` | `TIMESTAMP` | Defaults to `SYSTIMESTAMP` |

**`TEST_USER.DEPARTMENTS`**

| Column | Type | Notes |
|---|---|---|
| `DEPARTMENT_ID` | `NUMBER(10)` | Primary key, auto-generated identity |
| `DEPARTMENT_NAME` | `VARCHAR2(100)` | Not null |
| `LOCATION` | `VARCHAR2(200)` | Optional |
| `MANAGER_ID` | `NUMBER(10)` | Optional reference to an employee |
| `CREATED_AT` | `TIMESTAMP` | Defaults to `SYSTIMESTAMP` |

**`TEST_USER.PROJECTS`**

| Column | Type | Notes |
|---|---|---|
| `PROJECT_ID` | `NUMBER(10)` | Primary key, auto-generated identity |
| `PROJECT_NAME` | `VARCHAR2(150)` | Not null |
| `DEPARTMENT_ID` | `NUMBER(10)` | Foreign key → `DEPARTMENTS.DEPARTMENT_ID` |
| `START_DATE` | `DATE` | Optional |
| `END_DATE` | `DATE` | Optional |
| `BUDGET` | `NUMBER(15,2)` | Optional |
| `STATUS` | `VARCHAR2(20)` | `PLANNED`, `ACTIVE`, `ON_HOLD`, or `COMPLETED`; defaults to `PLANNED` |
| `CREATED_AT` | `TIMESTAMP` | Defaults to `SYSTIMESTAMP` |

---

#### 4. Grant Privileges on Tables

Grants DML privileges on all three tables to `TEST_USER`.

| Privilege | Tables |
|---|---|
| `SELECT, INSERT, UPDATE, DELETE` | `EMPLOYEES`, `DEPARTMENTS`, `PROJECTS` |
| `SELECT … WITH GRANT OPTION` | `EMPLOYEES`, `DEPARTMENTS`, `PROJECTS` |

The `WITH GRANT OPTION` on `SELECT` allows `TEST_USER` to further delegate read access to other users if needed.

---

### Prerequisites

- Oracle Database (12c or later recommended for identity columns)
- Connected as `SYS` or `SYSTEM` (DBA privileges required)
- A `TEMP` temporary tablespace must already exist (default in all standard Oracle installations)

### How to run

```sql
-- Connect as DBA
CONNECT SYS/password@your_db AS SYSDBA

-- Run the script
@oracle_test_schema_setup.sql
```

### Change the password before use

The default password in the script is `TestPass#2024`. Replace it with a strong password before running in any shared or non-local environment.
