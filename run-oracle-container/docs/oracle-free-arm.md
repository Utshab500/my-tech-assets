# Running Oracle Database Free on ARM (Apple Silicon)

## Prerequisites

- Docker or Podman installed and running
- An account at [container-registry.oracle.com](https://container-registry.oracle.com) (free account — no license acceptance needed for the Free edition)
- **Apple Silicon Mac (M1/M2/M3/M4)** or any ARM64 machine

**Login before pulling the image:**
```bash
export ORACLE_USERNAME=<your-email>
export ORACLE_PAT=<your-pat-token>

# Docker
echo $ORACLE_PAT | docker login container-registry.oracle.com -u $ORACLE_USERNAME --password-stdin

# Podman
echo $ORACLE_PAT | podman login container-registry.oracle.com -u $ORACLE_USERNAME --password-stdin
```

## Why `docker-compose-arm.yaml`?

Oracle Database Enterprise Edition (`database/enterprise`) does not have a native ARM64 image, making it incompatible with Apple Silicon Macs (M1/M2/M3/M4). Running it under x86 emulation via Rosetta is slow and unreliable.

`docker-compose-arm.yaml` uses **Oracle Database Free** (`database/free`), which provides a native ARM64-compatible image. It is a fully functional Oracle database with the following limits:

- 2 CPUs
- 2 GB RAM
- 12 GB user data

No license is required, making it ideal for local development on ARM machines.

## Commands to Run

**Start the container:**
```bash
docker compose -f docker-compose-arm.yaml up -d
```

**Check container status:**
```bash
docker ps
```

**View logs (useful on first startup — DB initialization takes a few minutes):**
```bash
docker logs -f oracle-free
```

**Stop the container:**
```bash
docker compose -f docker-compose-arm.yaml down
```

**Stop and remove all data (full reset):**
```bash
docker compose -f docker-compose-arm.yaml down -v
```

## How to Connect

| Parameter | Value |
|---|---|
| Host | `localhost` |
| Port | `1521` |
| Service Name | `FREEPDB1` |
| Username | `SYSTEM` |
| Password | `admin123` |

**SQLPlus:**
```bash
sqlplus system/admin123@localhost:1521/FREEPDB1
```

**JDBC connection string:**
```
jdbc:oracle:thin:@localhost:1521/FREEPDB1
```

**Easy Connect string:**
```
localhost:1521/FREEPDB1
```

**Full TNS descriptor:**
```
(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=localhost)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=FREEPDB1)))
```

> To connect as DBA: `sqlplus sys/admin123@localhost:1521/FREEPDB1 as sysdba`
>
> To connect to the root CDB instead of the PDB, use service name `FREE`.
