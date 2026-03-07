# Oracle DB in container
Here I try to run Oracle DB using docker and connect with SQL Developer VS Code Plugin.

## Instructions

### Pre-req
- Login to https://container-registry.oracle.com/
- Choose Database -> enterprise
- Click the Continue or Accept button next to the license agreement (you may need to select a language first).
- Generate a PAT token for your user

### Step 1
Use the PAT
```bash
docker login container-registry.oracle.com
```

### Step 2
```bash
docker compose up -d
```

### Step 3 (optional)
Wait for 20-30 mins till the DB setup is complete.
```bash
docker logs -f oracle-ee
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