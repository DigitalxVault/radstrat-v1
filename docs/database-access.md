# Database Access — Security Decision

## Context (I'm putting this here for the record only)

RADStrat serves the Republic of Singapore Air Force (RSAF). The production database (AWS RDS PostgreSQL) contains military training data, player progress, and authentication credentials. Security is non-negotiable.

## Decision: SSH Tunnel over Direct Cloud Connection

We access the database exclusively through **SSH tunneling via the EC2 bastion**, rather than exposing it to any external service (including Prisma Cloud, hosted DB GUIs, or direct internet connections).

## Why Not Prisma Cloud / Direct Connection?

| Concern | Prisma Cloud (Rejected) | SSH Tunnel (Chosen) |
|---------|------------------------|---------------------|
| **Network exposure** | Requires RDS to accept connections from Prisma's cloud IPs — opens the database to the internet | RDS only accepts connections from EC2's private security group — zero internet exposure |
| **Credential handling** | Database credentials stored on a third-party SaaS platform | Credentials never leave your machine and the server |
| **Data sovereignty** | Query results transit through third-party infrastructure outside our control | All data stays within the AWS VPC + your encrypted SSH tunnel |
| **Attack surface** | Additional external service = additional attack vector. If Prisma Cloud is compromised, attacker has DB credentials | Attack surface limited to EC2 SSH (key-based auth only, no passwords) |
| **Compliance** | Third-party data processing may conflict with military data handling requirements | All access auditable via EC2 SSH logs, no third-party involvement |
| **Security group changes** | Must whitelist Prisma Cloud IP ranges in RDS security group | No infrastructure changes needed |

## How It Works

```
Your Machine                    AWS VPC
+-----------+     SSH tunnel    +--------+     Private subnet    +--------+
| localhost | ================> |  EC2   | -------------------> |  RDS   |
| port 5433 |    (encrypted)   | bastion|   (security group)   | pg:5432|
+-----------+                   +--------+                      +--------+
```

1. SSH tunnel encrypts traffic from your machine to EC2
2. EC2 forwards the connection to RDS over the private VPC network
3. RDS security group only allows connections from EC2 — nothing else can reach it
4. When you close the tunnel, access is immediately revoked

## Architecture Constraints

- **RDS `PubliclyAccessible: false`** — enforced at AWS level, cannot be reached from outside the VPC
- **RDS Security Group** (`sg-0671ffc610fb6974d`) — inbound port 5432 allowed only from EC2 Security Group (`sg-0ccfd0c3b61ce1934`)
- **EC2 SSH** — key-based authentication only, no password auth, logged in `/var/log/auth.log`
- **No credentials in git** — `.env.production` exists only on the server with `chmod 600`

## Approved Access Methods

All methods require an active SSH tunnel first:

| Method | Use Case |
|--------|----------|
| **Prisma Studio** (local) | Visual table browsing, quick data inspection |
| **psql** | Raw SQL queries, migrations debugging |
| **TablePlus / DBeaver** | Full-featured GUI for complex queries |

## Security Notes

- Never expose RDS publicly — keep `PubliclyAccessible: false`
- Never commit database credentials to git
- Never open port 5432 in the RDS security group to `0.0.0.0/0`
- SSH key must have `chmod 400` permissions
- For team access, each developer gets their own SSH key added to EC2
