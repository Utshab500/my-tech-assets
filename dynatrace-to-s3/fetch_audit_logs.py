import os
import json
import logging
import requests
import urllib3
from dotenv import load_dotenv

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)
logger = logging.getLogger(__name__)

ENDPOINT_URL = os.environ["DYNATRACE_BASE_URL"]
API_TOKEN = os.environ["DYNATRACE_API_TOKEN"]

HEADERS = {
    "Authorization": f"Api-Token {API_TOKEN}",
    "Accept": "application/json",
}


def fetch_audit_logs() -> list[dict]:
    all_records = []
    page = 1

    logger.info("Starting fetch | url=%s", ENDPOINT_URL)

    url = ENDPOINT_URL
    while True:
        logger.info("Fetching page %d ...", page)
        response = requests.get(url, headers=HEADERS, verify=False)

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


def run():
    logger.info("Run started")

    logs = fetch_audit_logs()

    logger.info("Total records fetched: %d", len(logs))
    print(json.dumps(logs, indent=2))


def lambda_handler(event, context):
    run()


if __name__ == "__main__":
    run()
