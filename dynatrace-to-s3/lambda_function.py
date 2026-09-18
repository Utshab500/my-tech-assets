import os
import json
import logging
import boto3
import requests
import urllib3
from datetime import datetime, timezone
from dotenv import load_dotenv

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)
logger = logging.getLogger(__name__)

ENDPOINT_URL = f"{os.environ['DYNATRACE_BASE_URL']}/api/v2/auditlogs"

S3_FOLDER = "DynatraceLogs"


def get_api_token() -> str:
    secret_name = os.environ["SECRET_NAME"]
    logger.info("Fetching Dynatrace API token from secret '%s'", secret_name)

    client = boto3.client("secretsmanager")
    response = client.get_secret_value(SecretId=secret_name)

    secret = json.loads(response["SecretString"])
    token = secret["dynatrace_api_token"]

    logger.info("Successfully retrieved Dynatrace API token from Secrets Manager")
    return token


def fetch_audit_logs(api_token: str) -> list[dict]:
    headers = {
        "Authorization": f"Api-Token {api_token}",
        "Accept": "application/json",
    }

    all_records = []
    page = 1

    logger.info("Starting fetch | url=%s", ENDPOINT_URL)

    url = ENDPOINT_URL
    while True:
        logger.info("Fetching page %d ...", page)
        response = requests.get(url, headers=headers, verify=False)

        logger.info("HTTP %s", response.status_code)
        response.raise_for_status()

        data = response.json()
        logger.debug("Response keys: %s", list(data.keys()))

        records = data.get("auditLogs", data.get("items", data.get("results", [])))
        all_records.extend(records)

        logger.info("Page %d: got %d records (running total: %d)", page, len(records), len(all_records))

        next_page_key = data.get("nextPageKey")
        if not next_page_key:
            logger.info("No more pages. Fetch complete.")
            break

        url = next_page_key
        page += 1

    return all_records


def build_s3_key(fetched_at: str) -> str:
    return f"{S3_FOLDER}/auditlogs-{fetched_at}.ndjson"


def write_to_s3(records: list[dict], bucket: str, s3_key: str) -> None:
    logger.info("Writing %d records to s3://%s/%s", len(records), bucket, s3_key)

    ndjson_body = "\n".join(json.dumps(record) for record in records)

    s3 = boto3.client("s3")
    s3.put_object(
        Bucket=bucket,
        Key=s3_key,
        Body=ndjson_body.encode("utf-8"),
        ContentType="application/x-ndjson",
    )

    logger.info("Successfully written to s3://%s/%s", bucket, s3_key)


def run(bucket: str) -> None:
    logger.info("Run started | bucket=%s", bucket)

    fetched_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")

    api_token = get_api_token()
    records = fetch_audit_logs(api_token)

    if not records:
        logger.info("No records fetched. Skipping S3 write.")
        return

    s3_key = build_s3_key(fetched_at)
    write_to_s3(records, bucket, s3_key)

    logger.info("Run complete | total_records=%d | s3_key=%s", len(records), s3_key)


def lambda_handler(event, context):
    bucket = os.environ["S3_BUCKET"]
    run(bucket)


if __name__ == "__main__":
    bucket = os.environ["S3_BUCKET"]
    run(bucket)
