# Running Oracle Database Enterprise Edition

## Prerequisites

- Docker or Podman installed and running
- An account at [container-registry.oracle.com](https://container-registry.oracle.com)
- License agreement accepted: log in → Database → enterprise → accept the license
- A Personal Access Token (PAT) generated for your account
- **x86/amd64 machine** — this image does not have a native ARM64 build; on Apple Silicon it runs under emulation and DB init can take 20–30 minutes (use `docker-compose-arm.yaml` instead)

**Login before pulling the image:**
```bash
export ORACLE_USERNAME=<your-email>
export ORACLE_PAT=<your-pat-token>

# Docker
echo $ORACLE_PAT | docker login container-registry.oracle.com -u $ORACLE_USERNAME --password-stdin

# Podman
echo $ORACLE_PAT | podman login container-registry.oracle.com -u $ORACLE_USERNAME --password-stdin
```

## Why `docker-compose.yaml`?

Oracle Database Enterprise Edition is the full commercial release of Oracle DB. It is used when you need features not available in Oracle Free, such as:

- Advanced security (TDE, VPD, label security)
- Partitioning, RAC, Data Guard
- Advanced analytics and compression
- No resource caps (CPU, RAM, storage)

This setup is intended for **x86/amd64 machines** (Linux or Intel-based Macs). It is not suitable for Apple Silicon — use `docker-compose-arm.yaml` instead.

> Requires acceptance of Oracle's license terms. Pull access requires a free account at [container-registry.oracle.com](https://container-registry.oracle.com).

## Commands to Run

**Login to Oracle Container Registry (one-time):**
```bash
docker login container-registry.oracle.com
```

**Start the container:**
```bash
docker compose -f docker-compose.yaml up -d
```

**Check container status:**
```bash
docker ps
```

**View logs (DB initialization can take 10–15 minutes on first run):**
```bash
docker logs -f oracle-ee
```

**Stop the container:**
```bash
docker compose -f docker-compose.yaml down
```

**Stop and remove all data (full reset):**
```bash
docker compose -f docker-compose.yaml down -v
```

## How to Connect

| Parameter | Value |
|---|---|
| Host | `localhost` |
| Port | `1521` |
| Service Name | `ORCLPDB1` |
| Username | `SYSTEM` |
| Password | `admin123` |

**SQLPlus:**
```bash
sqlplus system/admin123@localhost:1521/ORCLPDB1
```

**JDBC connection string:**
```
jdbc:oracle:thin:@localhost:1521/ORCLPDB1
```

**Easy Connect string:**
```
localhost:1521/ORCLPDB1
```

**Full TNS descriptor:**
```
(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=localhost)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=ORCLPDB1)))
```

> To connect as DBA: `sqlplus sys/admin123@localhost:1521/ORCLPDB1 as sysdba`
>
> To connect to the root CDB instead of the PDB, use service name `ORCLCDB`.
>
> EM Express (web-based DB console) is available at `https://localhost:5500/em`.
