# Dynatrace Audit Logs → S3

## Project Goal

Poll Dynatrace audit logs via `/api/v2/auditlogs` and write them to S3. Everything downstream (SQS → Poster Lambda → Logic App → Sentinel) is already built — this project only covers getting logs into S3.

## Chosen Approach: Custom Polling Lambda

EventBridge-scheduled Lambda that fetches audit logs and writes to S3. Chosen over OpenPipeline because OpenPipeline requires a DPS License with Grail-backed capabilities and inflates Retain costs through record enrichment.

## Architecture (in scope)

```
EventBridge (rate: 5min)
  → Collector Lambda
      - read checkpoint (DynamoDB/SSM)
      - fetch window: from=last_success, to=now
      - paginate nextPageKey until exhausted
      - write each page to S3 (idempotent key)
      - advance checkpoint only after S3 write succeeds
  → S3  ← done here
```

## AWS Resources

| Resource | Purpose |
|----------|---------|
| **Lambda** (Collector) | Polling function; timeout set to 15 min |
| **EventBridge Scheduler** | Triggers Lambda every 5 min |
| **S3 Bucket** | Stores audit log JSON files |
| **DynamoDB Table** | Checkpoint (`last_success` timestamp) + conditional-write concurrency lock |
| **Lambda Env Vars** | `DYNATRACE_API_TOKEN`, `DYNATRACE_BASE_URL` — SSM/Secrets Manager TBD later |
| **IAM Execution Role** | Lambda permissions — see below |

### Lambda IAM Role Permissions

| Permission | Resource |
|------------|----------|
| `s3:PutObject` | Target S3 bucket |
| `dynamodb:GetItem`, `PutItem`, `UpdateItem` | Checkpoint/lock table |
| ~~`ssm:GetParameter`~~ | Not needed — token passed via env var for now |
| `logs:CreateLogGroup`, `logs:PutLogEvents` | CloudWatch log group |

## Key Implementation Rules

- **Checkpoint drives the fetch window** — always use `from`=last persisted checkpoint, `to`=now. Never derive the window from the schedule interval.
- **Cap each invocation window** — max 1hr of data per run to avoid hitting the 15-min Lambda timeout on backlogs. Let successive runs catch up naturally.
- **DynamoDB conditional-write lock** — prevents double-polling if a run overruns its interval and the next one fires concurrently.
- **Idempotent S3 keys** — format: `from=<ts>-to=<ts>-<page>.json`. Retries overwrite, not duplicate.
- **Checkpoint advances only after S3 write succeeds** — combined with idempotent keys, partial-failure retries are safe.

## Cost Components

| Component | Notes |
|-----------|-------|
| Lambda | Execution time + invocations |
| S3 | Storage + PUT requests |
| EventBridge Scheduler | ~$1/million schedules; free tier covers <14M |
| DynamoDB | Checkpoint + lock table — negligible at this scale |

## Why Not OpenPipeline

- Requires DPS License (Grail-backed)
- Billing: Ingest & Process (GiB) + Retain (GiB-day) + Query (DQL scan volume)
- Enrichment inflates record size → higher Retain cost
- Can create additional billable Grail events
