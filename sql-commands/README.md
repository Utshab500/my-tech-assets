# SQL Commands

A collection of Oracle SQL scripts for learning and reference.

## Repository Structure

```
sql-commands/
├── README.md
└── scripts/
    ├── oracle_test_schema_setup.sql      # Provisions the test schema
    └── oracle_test_schema_teardown.sql   # Cleans up the test schema
```

---

## scripts/oracle_test_schema_setup.sql

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

Using the **Oracle SQL Developer** extension in VS Code:

1. Open the **Database** panel from the Activity Bar (or `Ctrl+Shift+P` → `Oracle: Open Database Explorer`)
2. Click **+** to add a new connection and fill in your DBA credentials (`SYS` or `SYSTEM`, role: `SYSDBA`)
3. Once connected, open `scripts/oracle_test_schema_setup.sql` in the editor
4. Press `Ctrl+Shift+P` → **Oracle: Execute All Statements** to run the entire script, or highlight individual statements and press `Ctrl+Enter` to run them one at a time
5. Check the **Query Result** panel at the bottom to confirm each statement completed without errors

### Change the password before use

The default password in the script is `TestPass#2024`. Replace it with a strong password before running in any shared or non-local environment.

---

## scripts/oracle_test_schema_teardown.sql

Reverses everything created by `oracle_test_schema_setup.sql`. Run this to fully clean up the test environment. Must be executed as a DBA.

### What it does

Steps are executed in reverse dependency order to avoid constraint violations:

| Step | Action |
|---|---|
| **1** | Revoke all DML privileges on the three tables from `TEST_USER` |
| **2** | Drop `PROJECTS` first (has FK to `DEPARTMENTS`), then `DEPARTMENTS`, then `EMPLOYEES` — each with `PURGE` to bypass the recycle bin |
| **3** | Drop `TEST_USER CASCADE` to remove the user and any remaining schema objects |
| **4** | Drop `TEST_TS` tablespace with `INCLUDING CONTENTS AND DATAFILES` to delete the datafile from disk |

### How to run

Using the **Oracle SQL Developer** extension in VS Code:

1. Open the **Database** panel and connect with your DBA credentials (`SYS` or `SYSTEM`, role: `SYSDBA`)
2. Open `scripts/oracle_test_schema_teardown.sql` in the editor
3. Press `Ctrl+Shift+P` → **Oracle: Execute All Statements** to run the entire script, or highlight individual statements and press `Ctrl+Enter` to run them one at a time
4. Check the **Query Result** panel to confirm each statement completed without errors

> **Warning:** This script is destructive and irreversible. All data in the `TEST_USER` schema will be permanently deleted.
