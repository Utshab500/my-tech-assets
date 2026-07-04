# Oracle DB in container
Here I try to run Oracle DB using docker and connect with SQL Developer VS Code Plugin.

## Instructions

### Pre-req
- Login to https://container-registry.oracle.com/
- Choose Database -> enterprise
- Click the Continue or Accept button next to the license agreement (you may need to select a language first).
- Generate a PAT token for your user

### Step 1
Use the PAT — set your credentials as env variables, then login:
```bash
export ORACLE_USERNAME=<your-email>
export ORACLE_PAT=<your-pat-token>

# Docker
echo $ORACLE_PAT | docker login container-registry.oracle.com -u $ORACLE_USERNAME --password-stdin

# Podman
echo $ORACLE_PAT | podman login container-registry.oracle.com -u $ORACLE_USERNAME --password-stdin
```

### Step 2
```bash
# Docker
docker compose up -d

# Podman (use podman-compose, not podman compose — see Troubleshooting)
podman-compose up -d
```

### Step 3 (optional)
Wait for 20-30 mins till the DB setup is complete.
```bash
# Docker
docker logs -f oracle-ee

# Podman
podman logs -f oracle-ee
```

### Step 4
- Download [SQL Developer for VS Code extentions](https://marketplace.visualstudio.com/items?itemName=Oracle.sql-developer).

### Step 5
Fill up with below details
|Field|Value|
|-|-|
|Role|SYSDBA|
|Username|sys|
|Password|admin123|
|Hostname|localhost|
|Port|1521|
|Service Name|ORCLPDB1|

# Troubleshooting

## `podman compose` fails with authentication error

### Issue
`podman compose` delegates to `/usr/local/bin/docker-compose`, which reads from Docker's credential store (`~/.docker/config.json`). But `podman login` saves credentials to Podman's store (`~/.config/containers/auth.json`), so `docker-compose` can't find them.

```
unable to retrieve auth token: invalid username/password: authentication required
```

### Fix
Install native `podman-compose` which reads from Podman's credential store directly:
```bash
pip3 install podman-compose
```

Then add it to your PATH (it installs to `~/Library/Python/3.14/bin/`):
```bash
export PATH="$PATH:~/Library/Python/3.14/bin"
```

To make it permanent, add the above line to your `~/.zshrc`.

Then use `podman-compose` instead of `podman compose`:
```bash
podman-compose up -d
```

---

## Platform mismatch warning (Apple Silicon)

### Issue
The Oracle Enterprise image is only available for `linux/amd64`. On Apple Silicon (arm64) you will see:

```
WARNING: image platform (linux/amd64) does not match the expected platform (linux/arm64)
```

### Impact
The container will still run via emulation but DB initialisation will be slower than usual — expect **20-30 minutes** before the DB is ready. Monitor progress with:

```bash
podman logs -f oracle-ee
```