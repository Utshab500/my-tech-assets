# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

This is a personal monorepo of independent proof-of-concept projects. Each subdirectory is a self-contained POC — there is no shared build system or root `package.json`. The current active branch is `dev/efs-backup`, targeting an AWS EFS backup POC.

Branch naming convention: `dev/<topic>` for in-progress POCs, `main` as the stable index.

---

## Project types and patterns

### Python Lambda functions (`dynatrace-to-s3`)

Entry point is `lambda_function.py` with a `lambda_handler(event, context)` function that also runs standalone via `if __name__ == "__main__"`.

```bash
pip install -r requirements.txt        # install deps
python lambda_function.py              # run locally (requires .env with env vars)
```

**Packaging for Lambda deployment** (produces a zip for manual upload):
```bash
# macOS/Linux
bash package.sh

# Windows (PowerShell)
.\package.ps1

# Windows (cmd)
package.bat
```

Secrets are fetched at runtime from AWS Secrets Manager (`boto3`). Local runs use `.env` via `python-dotenv`. Never hardcode credentials.

### Terraform infrastructure (`aws-cloud-hsm-poc`)

Standard Terraform layout: `main.tf`, `variables.tf`, `outputs.tf`, `provider.tf`.

```bash
terraform init
terraform plan
terraform apply
terraform destroy
```

State files (`terraform.tfstate`, `*.backup`) are committed in POC dirs — intentional for reproducibility, not a production pattern.

### Node.js AWS scripts (`aws-cost-fetch`)

Uses ES modules (`"type": "module"` in `package.json`), AWS SDK v3, and AWS SSO credentials.

```bash
npm install
node index.js
```

AWS profile name used in `aws-cost-fetch`: `gsg-dev`. SSO login is handled automatically if the token is expired.

### Python AI agents (`AI-agent-pocs/my-mutual-fund-agent`)

LangChain-based agents that swap between Anthropic Claude and Google Gemini via model wrappers in `models/claud.py` and `models/gemini.py`.

```bash
pip install -r requirements.txt
python app.py
```

Model selection is controlled by env vars: `ANTHROPIC_MODEL` (default `claude-3-haiku-20240307`) and `GOOGLE_MODEL`. API keys come from `.env` (`ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`).

### Kubernetes manifests (`k8-*`, `helm-charts`, `tls-ssl-install-in-k8-ingres`)

Plain YAML manifests applied with `kubectl apply -f <file>.yml`. No automation layer — apply manually. GKE-targeted configs use annotations specific to GCP load balancers.

### React/Next.js frontend (`virtual-gym-coach`, `sigmapad`)

See the project-level `CLAUDE.md` files within those directories for specific commands and architecture.

---

## AWS credential pattern

POCs authenticate via AWS SSO (`aws sso login --profile <profile>`). The active profile varies by project; check the source file for the profile name. Credential providers use `@aws-sdk/credential-provider-sso` (Node) or `boto3` default chain (Python, which reads `~/.aws/`).

---

## Adding a new POC

1. Create a new subdirectory with a descriptive name.
2. Work on a `dev/<name>` branch.
3. Add an entry to the table in `README.md` on `main` when merging.
4. Each POC should be self-contained with its own `requirements.txt` or `package.json`.
