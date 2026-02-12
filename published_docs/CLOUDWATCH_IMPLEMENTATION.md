# CloudWatch + Structured Logging Implementation

**Date:** 2026-02-12
**Phase:** 5

---

## What Was Set Up

### 1. Structured Pino Logging (Code)

**Files changed:**
- `apps/api/src/app.ts` — structured JSON serializers in production (request method, URL, userAgent, statusCode)
- `apps/api/src/plugins/request-id.ts` — new plugin that generates `X-Request-ID` per request (UUID), uses incoming header if present

**Production log format per request:**
```json
{"level":30,"time":1707700000000,"reqId":"uuid","req":{"method":"GET","url":"/health","userAgent":"..."},"res":{"statusCode":200},"responseTime":12}
```

**Error logs include:** `err.message`, `err.name`, `err.stack`, `statusCode`, `reqId`

**Dev mode:** Still uses `pino-pretty` with colorized output (no change).

### 2. CloudWatch Agent on EC2

- **Package:** `amazon-cloudwatch-agent` v1.300064
- **Config:** `/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json`
- **Ships:** PM2 logs (`/var/log/pm2/*.log`) to CloudWatch Logs
- **Log group:** `/radstrat/api`
- **Retention:** 30 days
- **Log stream:** Named by EC2 instance ID

### 3. IAM Configuration

- **Policy:** `RadStratCloudWatchPolicy` — allows `logs:CreateLogGroup`, `CreateLogStream`, `PutLogEvents`, `DescribeLogStreams`, `cloudwatch:PutMetricData`
- **Role:** `RadStratEC2Role` — EC2 trust policy with CloudWatch policy attached
- **Instance profile:** `RadStratEC2Role` — associated with EC2 instance `i-0bf5c55214f9c91d4`

### 4. SNS Alerts

- **Topic:** `radstrat-alerts` (arn:aws:sns:ap-southeast-1:609655784393:radstrat-alerts)
- **Subscriber:** eugene.tan@magesstudio.com.sg (confirmed)
- **Adding more emails:** `aws sns subscribe --topic-arn arn:aws:sns:ap-southeast-1:609655784393:radstrat-alerts --protocol email --notification-endpoint NEW_EMAIL --region ap-southeast-1`

### 5. CloudWatch Alarms

| Alarm | Trigger | Period |
|-------|---------|--------|
| `radstrat-5xx-errors` | >5 errors matching `statusCode >= 500` | 5 minutes |
| `radstrat-health-check` | Health check status < 1 | 3 consecutive 1-min checks |

Both alarms notify via SNS → email.

### 6. PM2 Log Rotation

- **Module:** `pm2-logrotate`
- **Max size:** 10 MB per file
- **Retain:** 7 rotated files
- **Compression:** enabled

### 7. Deploy Script Update

- `deploy.sh` — added CloudWatch Agent restart after PM2 reload (non-fatal if agent not installed)

---

## How to Verify

1. **Structured logs locally:** `pnpm dev --filter=@repo/api` → hit `/health` → check terminal for JSON log with `reqId`
2. **CloudWatch Console:** Log groups → `/radstrat/api` → should show log entries after next deploy
3. **Test alarm:** Trigger a 500 error → check email for alarm notification
4. **Agent status (SSH):** `sudo amazon-cloudwatch-agent-ctl -a status` → should show `"status": "running"`
5. **Log rotation (SSH):** `pm2 describe pm2-logrotate` → should show online

---

## AWS Resources Created

| Resource | Name / ARN | Region |
|----------|-----------|--------|
| IAM Policy | `RadStratCloudWatchPolicy` | Global |
| IAM Role | `RadStratEC2Role` | Global |
| Instance Profile | `RadStratEC2Role` | Global |
| SNS Topic | `arn:aws:sns:ap-southeast-1:609655784393:radstrat-alerts` | ap-southeast-1 |
| Metric Filter | `5xxErrors` on `/radstrat/api` | ap-southeast-1 |
| Alarm | `radstrat-5xx-errors` | ap-southeast-1 |
| Alarm | `radstrat-health-check` | ap-southeast-1 |
| Log Group | `/radstrat/api` | ap-southeast-1 |
