# Phase 1: AWS Infrastructure - Research

**Researched:** 2026-02-05
**Domain:** AWS cloud infrastructure setup (EC2, RDS, Nginx, Let's Encrypt)
**Confidence:** HIGH

## Summary

This phase involves setting up production-ready AWS infrastructure in ap-southeast-1 (Singapore) for a new AWS user. The standard approach is manual setup via AWS Console with RDS PostgreSQL (private), EC2 Ubuntu 22.04 with Node.js/PM2/Nginx, proper security groups, and Let's Encrypt SSL.

**Key findings:**
- Default VPC configuration in ap-southeast-1 provides suitable networking out-of-the-box for new users
- Security group configuration is the most common pitfall — must prevent RDS public access and restrict EC2 inbound
- Node.js 20 LTS via NodeSource repository is the current stable approach for Ubuntu 22.04
- Let's Encrypt with certbot handles SSL and auto-renewal with minimal configuration
- SSH tunnel through EC2 enables local database access without exposing RDS publicly

**Primary recommendation:** Follow AWS Console wizard approach for RDS and EC2, use default VPC, focus careful attention on security group configuration (EC2 SG → RDS SG reference pattern), and allocate Elastic IP before DNS configuration.

## Standard Stack

The established tools/configuration for AWS infrastructure setup in 2026:

### Core Components
| Component | Version/Type | Purpose | Why Standard |
|-----------|--------------|---------|--------------|
| RDS PostgreSQL | Latest (16.x) | Database server | Managed service, automatic backups, high availability |
| EC2 Ubuntu | 22.04 LTS | Application server | Long-term support through 2027, abundant community resources |
| Node.js | 20 LTS | Runtime environment | Maintenance LTS supported until April 2026 |
| PM2 | Latest (5.x) | Process manager | Industry standard, auto-restart, cluster mode, startup script support |
| Nginx | Latest stable | Reverse proxy | Performance, SSL termination, proven reliability |
| Let's Encrypt | via certbot | SSL certificates | Free, automatic renewal, widely adopted |

### Instance Sizing
| Resource | Size | Specs | When to Use |
|----------|------|-------|-------------|
| RDS | db.t3.micro | 2 vCPUs, 1GB RAM | Light testing load (~10 concurrent users), development/staging |
| EC2 | t3.small | 2 vCPUs, 2GB RAM | Small Node.js apps with Nginx, adequate for SIT environment |
| Storage | 20 GB gp3 | General Purpose SSD | Minimum viable for JSON blob storage, game progress data |

**Cost estimate (ap-southeast-1):**
- RDS db.t3.micro: ~$0.018/hour = ~$13/month (may qualify for free tier)
- EC2 t3.small: ~$0.021/hour = ~$15/month
- Storage: ~$2/month for 20GB
- Total: ~$30/month (excluding free tier benefits)

**Installation:**
```bash
# On EC2 Ubuntu 22.04
# Node.js 20 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs

# PM2 global installation
sudo npm install pm2@latest -g

# Nginx
sudo apt update
sudo apt install nginx

# Certbot for Let's Encrypt
sudo apt install certbot python3-certbot-nginx

# PostgreSQL client (psql)
sudo apt install postgresql-client
```

## Architecture Patterns

### Recommended AWS Resource Structure
```
ap-southeast-1 (Singapore Region)
├── Default VPC (172.31.0.0/16)
│   ├── Default Subnet AZ-1a (172.31.0.0/20)
│   ├── Default Subnet AZ-1b (172.31.16.0/20)
│   └── Default Subnet AZ-1c (172.31.32.0/20)
├── Security Groups
│   ├── EC2-SG (SSH:22 + HTTPS:443 inbound)
│   └── RDS-SG (PostgreSQL:5432 from EC2-SG only)
├── EC2 Instance
│   ├── Elastic IP (static public IP)
│   ├── Ubuntu 22.04 LTS
│   └── Stack: Node.js + PM2 + Nginx
└── RDS Instance
    ├── Private subnet (no public access)
    ├── DB Subnet Group (min 2 AZs)
    └── PostgreSQL 16.x
```

### Pattern 1: Security Group Configuration (EC2 ↔ RDS)
**What:** Security groups control network access with inbound/outbound rules. RDS should only accept connections from EC2 security group, not from the internet.

**When to use:** Always for production/staging environments with private database access.

**Example:**
```yaml
# EC2 Security Group
Name: ec2-app-sg
Inbound Rules:
  - Type: SSH (22), Source: 0.0.0.0/0 (or restrict to office IP)
  - Type: HTTPS (443), Source: 0.0.0.0/0
Outbound Rules:
  - Type: All traffic, Destination: 0.0.0.0/0

# RDS Security Group
Name: rds-db-sg
Inbound Rules:
  - Type: PostgreSQL (5432), Source: ec2-app-sg (SG reference, NOT IP)
Outbound Rules:
  - None required
```

**Key insight:** Use security group ID reference (sg-xxxxx) as source instead of IP addresses. This allows EC2 instances to connect regardless of IP changes.

### Pattern 2: Nginx Reverse Proxy for Node.js
**What:** Nginx acts as reverse proxy, forwarding HTTPS traffic to Node.js app on localhost:3000.

**When to use:** Production/staging Node.js applications requiring SSL termination and reverse proxy.

**Example:**
```nginx
# /etc/nginx/sites-available/api-staging.domain.com
server {
    listen 80;
    server_name api-staging.domain.com;

    # Certbot will modify this block to handle SSL redirect

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Activation:**
```bash
# Enable site configuration
sudo ln -s /etc/nginx/sites-available/api-staging.domain.com /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### Pattern 3: PM2 Process Management
**What:** PM2 keeps Node.js app running with auto-restart on crashes and server reboot.

**When to use:** All production/staging Node.js deployments.

**Example:**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'radstrat-api',
    script: './src/server.js',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: 'postgresql://user:pass@rds-endpoint:5432/dbname'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

**Startup configuration:**
```bash
# Start app with ecosystem file
pm2 start ecosystem.config.js

# Save process list
pm2 save

# Generate startup script (auto-start on boot)
pm2 startup

# Follow the output command (usually requires sudo)
```

### Pattern 4: SSH Tunnel for Local Database Access
**What:** Secure tunnel through EC2 bastion to access private RDS instance from local machine.

**When to use:** Database administration, migrations, local development against staging database.

**Example:**
```bash
# On local machine
ssh -i "keypair.pem" -N -L 5432:rds-endpoint.region.rds.amazonaws.com:5432 ubuntu@ec2-public-ip

# In another terminal, connect via localhost
psql -h localhost -p 5432 -U dbuser -d dbname
```

**Persistent tunnel (alternative):**
```bash
# Add to ~/.ssh/config
Host rds-tunnel
    HostName ec2-public-ip
    User ubuntu
    IdentityFile ~/.ssh/keypair.pem
    LocalForward 5432 rds-endpoint.region.rds.amazonaws.com:5432

# Connect with simple command
ssh -N rds-tunnel
```

### Anti-Patterns to Avoid
- **Public RDS Access:** Never enable "Publicly accessible" on RDS instances — major security risk
- **0.0.0.0/0 for SSH:** Restrict SSH source to office IP or VPN when possible
- **Hardcoded Credentials:** Use environment variables, never commit DATABASE_URL to git
- **No Elastic IP:** Without Elastic IP, EC2 public IP changes on restart, breaking DNS
- **Missing Auto-Renewal:** Certbot includes auto-renewal via systemd timer, but verify it's active

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSL certificate management | Custom cert scripts, manual renewal | Let's Encrypt + certbot | Auto-renewal via systemd timer, ACME protocol handles validation, widely tested |
| Process management | Custom restart scripts, cron monitoring | PM2 | Handles crashes, logs, clustering, startup scripts, zero-downtime reload |
| Reverse proxy | Node.js HTTPS server directly | Nginx | SSL termination, static file serving, better performance, battle-tested |
| Database backups | Custom pg_dump scripts | RDS automated backups | Point-in-time recovery, snapshots, managed retention, tested restore |
| Health monitoring | Custom HTTP checks | AWS Route 53 health checks or UptimeRobot | Multi-region checks, automatic failover, alerting |

**Key insight:** AWS RDS and Nginx/PM2/certbot are mature solutions handling edge cases (connection pooling, certificate renewal race conditions, graceful shutdown, log rotation) that custom scripts inevitably miss.

## Common Pitfalls

### Pitfall 1: RDS Publicly Accessible Flag
**What goes wrong:** When creating RDS instance, "Publicly accessible" defaults to "Yes" in some AWS Console flows. This exposes database to internet, major security risk.

**Why it happens:** AWS Console tries to be helpful for quick demos, but this setting is dangerous for production.

**How to avoid:**
- During RDS creation, under "Connectivity" → "Additional configuration" → explicitly select "Not publicly accessible"
- After creation, verify in RDS instance details that "Publicly accessible" shows "No"
- Security group should reference EC2 SG, not 0.0.0.0/0

**Warning signs:**
- RDS endpoint resolves to public IP (check with `nslookup`)
- Port 5432 open to internet (check with `nmap` or online port scanners)
- AWS Trusted Advisor flags publicly accessible database

**Remediation:**
```bash
# Check if RDS is publicly accessible
aws rds describe-db-instances --db-instance-identifier mydb \
  --query 'DBInstances[0].PubliclyAccessible'

# Modify to private (requires brief outage)
aws rds modify-db-instance --db-instance-identifier mydb \
  --no-publicly-accessible --apply-immediately
```

### Pitfall 2: Security Group 0.0.0.0/0 on RDS Port
**What goes wrong:** Security group allows inbound PostgreSQL (5432) from 0.0.0.0/0 instead of specific EC2 security group.

**Why it happens:** Confusion between IP address sources and security group references. Developers try to use EC2 IP but it changes on restart.

**How to avoid:**
- RDS security group inbound rule should use **Source: ec2-app-sg** (security group ID), NOT IP addresses
- Never use 0.0.0.0/0 for database ports
- Verify with: `aws ec2 describe-security-groups --group-ids sg-xxxxx`

**Warning signs:**
- Database accessible from home network (test with `psql -h rds-endpoint`)
- AWS Security Hub or Trusted Advisor flags unrestricted database access
- Security group shows 0.0.0.0/0 source

**Correct configuration example:**
```
RDS Security Group Inbound Rules:
  Rule 1:
    Type: PostgreSQL (5432)
    Source: Custom (ec2-app-sg / sg-0abc123def456)
    Description: Allow PostgreSQL from app servers only
```

### Pitfall 3: Missing Elastic IP for EC2
**What goes wrong:** EC2 instance uses default public IP, which changes when instance stops/starts. DNS A record becomes invalid, HTTPS certificate breaks.

**Why it happens:** New users don't realize EC2 public IPs are ephemeral. They configure DNS, get SSL cert, then instance restart breaks everything.

**How to avoid:**
- Allocate Elastic IP immediately after launching EC2 (before DNS configuration)
- Associate Elastic IP with EC2 instance
- Use Elastic IP in DNS A record, not the auto-assigned public IP
- Elastic IPs are free when associated with running instance

**Warning signs:**
- Public IP in EC2 details doesn't match DNS record after restart
- SSL certificate validation fails after instance restart
- Cannot SSH to previously working IP address

**Correct sequence:**
1. Launch EC2 instance
2. **Allocate and associate Elastic IP**
3. Configure DNS A record with Elastic IP
4. Run certbot for SSL certificate
5. Deploy application

### Pitfall 4: Certbot Before DNS Propagation
**What goes wrong:** Running `certbot --nginx -d domain.com` before DNS A record propagates to Elastic IP. Let's Encrypt validation fails because domain doesn't resolve to EC2.

**Why it happens:** DNS propagation takes time (minutes to hours). Impatient setup attempts certbot too early.

**How to avoid:**
- Configure DNS A record in Hostinger (or registrar)
- Wait 5-15 minutes for propagation
- Test with `nslookup api-staging.domain.com` — should return Elastic IP
- Only then run certbot

**Warning signs:**
- Certbot error: "DNS problem: NXDOMAIN looking up A for domain.com"
- `nslookup domain.com` returns no results or old IP
- Certbot validation fails immediately

**Verification steps:**
```bash
# Check DNS propagation
nslookup api-staging.yourdomain.com

# Alternative check
dig api-staging.yourdomain.com +short

# Should return the Elastic IP address
```

### Pitfall 5: Node.js Version Mismatch
**What goes wrong:** Installing Node.js from Ubuntu default repository installs old version (12.x or 14.x), not Node.js 20 LTS. Code may fail with missing features.

**Why it happens:** Ubuntu 22.04 default repositories contain older Node.js versions for stability. Developers use `apt install nodejs` without adding NodeSource repository.

**How to avoid:**
- **Never use:** `sudo apt install nodejs` (default repository)
- **Always use:** NodeSource setup script for Node.js 20
- Verify version after install: `node -v` should show v20.x.x

**Warning signs:**
- `node -v` shows v12.x or v14.x
- npm packages fail with "unsupported engine" errors
- Modern JavaScript features (top-level await, etc.) don't work

**Correct installation:**
```bash
# NodeSource repository setup for Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

# Verify versions
node -v   # Should show v20.x.x
npm -v    # Should show 10.x.x or higher
```

### Pitfall 6: PM2 Not Configured for Startup
**What goes wrong:** PM2 successfully runs app, but after EC2 restart, app doesn't start automatically. Service is down until manual SSH and `pm2 restart`.

**Why it happens:** PM2 requires explicit startup script generation. Just running `pm2 start` doesn't persist across reboots.

**How to avoid:**
- After first `pm2 start`, run `pm2 save` to save process list
- Run `pm2 startup` and execute the generated command (requires sudo)
- Test by rebooting EC2 and verifying app restarts automatically

**Warning signs:**
- App works after deployment but disappears after server restart
- `pm2 list` shows no processes after EC2 reboot
- Manual intervention required after every restart

**Correct setup:**
```bash
# Start your app
pm2 start ecosystem.config.js

# Save current process list
pm2 save

# Generate startup script
pm2 startup
# Output will be something like:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Run the generated command (copy-paste from output)
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Verify (optional)
sudo systemctl status pm2-ubuntu
```

### Pitfall 7: RDS DB Subnet Group Missing AZs
**What goes wrong:** Creating RDS instance fails with error "DB Subnet Group doesn't meet availability zone coverage requirement."

**Why it happens:** DB subnet group requires subnets in at least 2 different availability zones for high availability. New users select only one subnet.

**How to avoid:**
- When creating DB subnet group, select subnets from **at least 2 different AZs**
- Default VPC provides 3 subnets (1a, 1b, 1c) — select at least 2
- If using default VPC, AWS may auto-create subnet group with all 3 AZs

**Warning signs:**
- RDS creation fails with subnet group error
- Only one availability zone listed in subnet group details
- Cannot proceed past "Connectivity" section in RDS wizard

**Correct configuration:**
```
DB Subnet Group: default (or custom)
Subnets:
  ✓ subnet-xxx (ap-southeast-1a)
  ✓ subnet-yyy (ap-southeast-1b)

Minimum: 2 AZs required
Recommended: 3 AZs for default VPC
```

### Pitfall 8: Forgetting to Test RDS Connection from EC2
**What goes wrong:** RDS instance created, security groups look correct, but app can't connect. Hours wasted debugging application code instead of infrastructure.

**Why it happens:** Skipping basic connectivity test. Security group misconfiguration (wrong source, wrong port, wrong protocol) not caught early.

**How to avoid:**
- SSH into EC2 instance immediately after RDS creation
- Install psql client: `sudo apt install postgresql-client`
- Test connection: `psql -h rds-endpoint -U dbuser -d postgres`
- Verify connection succeeds **before** deploying application code

**Warning signs:**
- Application logs show "connection refused" or timeout errors
- Cannot establish database connection from app but everything "looks configured"
- Hours of app debugging before testing basic network connectivity

**Verification checklist:**
```bash
# 1. SSH into EC2
ssh -i keypair.pem ubuntu@ec2-elastic-ip

# 2. Install psql client
sudo apt update
sudo apt install postgresql-client -y

# 3. Test RDS connection
psql -h your-rds-endpoint.region.rds.amazonaws.com -U your-db-user -d postgres

# Expected: Password prompt, then postgres=> prompt
# If timeout/refused: Security group misconfigured
# If authentication failed: Correct connectivity, wrong credentials
```

## Code Examples

Verified patterns from official sources and recent guides:

### Minimal Node.js Health Check Endpoint
```javascript
// server.js - Minimal Express server for Phase 1 verification
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Source:** [Express health check patterns](https://hyperping.com/blog/how-to-add-a-nodejs-health-check-endpoint-using-express)

**Testing:**
```bash
# From EC2 (after starting app)
curl http://localhost:3000/health
# Expected: {"status":"ok"}

# From external (after Nginx + SSL setup)
curl https://api-staging.domain.com/health
# Expected: {"status":"ok"}
```

### PM2 Ecosystem File for Production
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'radstrat-api',
    script: './src/server.js',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/radstrat'
    },
    error_file: '/home/ubuntu/logs/err.log',
    out_file: '/home/ubuntu/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

**Source:** [PM2 Ecosystem Setup Guide 2026](https://medium.com/@zulfikarditya/pm2-ecosystem-setup-guide-for-node-js-nestjs-45b0eee8629a)

**Usage:**
```bash
# Start with ecosystem file
pm2 start ecosystem.config.js

# View logs
pm2 logs radstrat-api

# Restart after code changes
pm2 restart radstrat-api

# Monitor
pm2 monit
```

### Nginx Site Configuration Template
```nginx
# /etc/nginx/sites-available/api-staging.domain.com
server {
    listen 80;
    server_name api-staging.yourdomain.com;

    # Rate limiting (optional but recommended)
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

    # Logging
    access_log /var/log/nginx/api-staging.access.log;
    error_log /var/log/nginx/api-staging.error.log;

    location / {
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # Request headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        proxy_cache_bypass $http_upgrade;
    }
}
```

**Source:** [Nginx reverse proxy configuration 2026](https://blog.logrocket.com/how-to-run-node-js-server-nginx/)

**Activation:**
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/api-staging.domain.com /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Let's Encrypt SSL Setup Commands
```bash
# Run certbot with Nginx plugin
sudo certbot --nginx -d api-staging.yourdomain.com

# Certbot will:
# 1. Verify domain ownership via HTTP-01 challenge
# 2. Obtain SSL certificate from Let's Encrypt
# 3. Automatically modify Nginx config to enable HTTPS
# 4. Set up auto-renewal via systemd timer

# Test auto-renewal (dry run)
sudo certbot renew --dry-run

# Check renewal timer status
sudo systemctl status certbot.timer

# View certificates
sudo certbot certificates
```

**Source:** [Let's Encrypt Certbot on Ubuntu 22.04](https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-22-04)

**Post-certbot Nginx configuration:**
```nginx
# Certbot adds HTTPS server block automatically
server {
    listen 443 ssl http2;
    server_name api-staging.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api-staging.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api-staging.yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # ... existing location blocks ...
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name api-staging.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### PostgreSQL Connection Test Script
```bash
#!/bin/bash
# test-rds-connection.sh
# Run on EC2 to verify RDS connectivity

RDS_ENDPOINT="your-rds-endpoint.ap-southeast-1.rds.amazonaws.com"
DB_USER="your_db_user"
DB_NAME="postgres"

echo "Testing RDS connection..."
echo "Endpoint: $RDS_ENDPOINT"
echo "User: $DB_USER"
echo ""

# Test connection with psql
PGPASSWORD="your_password" psql -h "$RDS_ENDPOINT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ RDS connection successful!"
else
    echo ""
    echo "❌ RDS connection failed!"
    echo "Check:"
    echo "  1. Security group allows inbound 5432 from EC2 SG"
    echo "  2. RDS endpoint is correct"
    echo "  3. Database user credentials are correct"
fi
```

## State of the Art

| Old Approach | Current Approach (2026) | When Changed | Impact |
|--------------|-------------------------|--------------|--------|
| Manual SSL renewal | Let's Encrypt + certbot auto-renewal | 2020-2021 | Systemd timer handles renewal, no manual intervention |
| Node.js 16 LTS | Node.js 20 LTS | April 2023 | Maintenance LTS until April 2026, required for latest features |
| PostgreSQL 14 | PostgreSQL 16 | September 2023 | Performance improvements, JSON enhancements |
| T2 instances | T3/T4g instances | 2018-2020 | Better baseline performance, credit system, lower cost |
| Separate certbot PPA | Built-in certbot via snap/apt | 2021-2022 | Simplified installation, better Ubuntu integration |
| Manual pm2 log rotation | PM2 built-in log management | 2019-2020 | Automatic log rotation, no external logrotate config |

**Deprecated/outdated:**
- **Node.js 14/16:** End of life, use Node.js 20 LTS
- **T2 instances:** T3 instances offer better value and performance
- **HTTP-only deployments:** HTTPS is standard, Let's Encrypt makes it free and easy
- **Manual iptables rules:** Security groups are AWS-native and more maintainable
- **Public RDS instances:** Never acceptable for production; use SSH tunnel for admin access

## Open Questions

Things that couldn't be fully resolved:

1. **Default VPC vs. Custom VPC for production**
   - What we know: Default VPC works fine for SIT/staging, provides public subnets with internet gateway
   - What's unclear: Whether company has specific VPC requirements or networking policies
   - Recommendation: Use default VPC for Phase 1 (fastest path to SIT), document any custom VPC requirements from company for future production deployment

2. **SSH key management across team**
   - What we know: User needs SSH access to EC2, other FS devs have AWS Console access
   - What's unclear: Whether team shares SSH key or each dev has their own key pair
   - Recommendation: Start with single key pair for user, document process for adding additional keys to `~/.ssh/authorized_keys` if needed

3. **Backup retention policy**
   - What we know: RDS automated backups enabled by default (7-day retention)
   - What's unclear: Company's backup retention requirements (7 days sufficient?)
   - Recommendation: Accept default 7-day retention for Phase 1, verify with company for production requirements

4. **Monitoring and alerting requirements**
   - What we know: Phase 1 focuses on infrastructure setup, not monitoring
   - What's unclear: Whether company has existing monitoring tools (CloudWatch, third-party)
   - Recommendation: Basic CloudWatch metrics enabled by default, defer comprehensive monitoring to later phase

## Sources

### Primary (HIGH confidence)

**AWS Official Documentation:**
- [Creating and connecting to PostgreSQL DB instance - RDS User Guide](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_GettingStarted.CreatingConnecting.PostgreSQL.html)
- [Default VPCs - Amazon VPC User Guide](https://docs.aws.amazon.com/vpc/latest/userguide/default-vpc.html)
- [Security groups for RDS - RDS User Guide](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Overview.RDSSecurityGroups.html)
- [Amazon EC2 key pairs - EC2 User Guide](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html)
- [Elastic IP addresses - EC2 User Guide](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/elastic-ip-addresses-eip.html)
- [Troubleshoot connecting to EC2 Linux instance](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/TroubleshootingInstancesConnecting.html)

**Ubuntu Official Documentation:**
- [Install and configure Nginx | Ubuntu](https://ubuntu.com/tutorials/install-and-configure-nginx)
- [PostgreSQL downloads for Ubuntu](https://www.postgresql.org/download/linux/ubuntu/)

**PM2 Official Documentation:**
- [PM2 - Installation Guide](https://pm2.io/docs/runtime/guide/installation/)
- [PM2 - Ecosystem File Reference](https://pm2.io/docs/runtime/reference/ecosystem-file/)
- [PM2 - Startup Script](https://pm2.keymetrics.io/docs/usage/startup/)

**Certbot Official Documentation:**
- [Certbot Instructions for Nginx on Ubuntu](https://certbot.eff.org/instructions?ws=nginx&os=ubuntufocal)

### Secondary (MEDIUM confidence)

**DigitalOcean Community Tutorials (verified with official docs):**
- [How to Install Node.js on Ubuntu 22.04](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-22-04)
- [How to Secure Nginx with Let's Encrypt on Ubuntu 22.04](https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-22-04)
- [How to Configure Nginx as a Reverse Proxy on Ubuntu 22.04](https://www.digitalocean.com/community/tutorials/how-to-configure-nginx-as-a-reverse-proxy-on-ubuntu-22-04)

**Recent Technical Articles (2025-2026):**
- [PM2 Ecosystem Setup Guide for Node.js/NestJS (Jan 2026)](https://medium.com/@zulfikarditya/pm2-ecosystem-setup-guide-for-node-js-nestjs-45b0eee8629a)
- [How to use Nginx as reverse proxy for Node.js - LogRocket](https://blog.logrocket.com/how-to-run-node-js-server-nginx/)
- [How to Add Node.js Health Check Endpoint - Hyperping Blog](https://hyperping.com/blog/how-to-add-a-nodejs-health-check-endpoint-using-express)

**AWS Community Resources:**
- [Ubuntu Amazon EC2 AMI Finder](https://cloud-images.ubuntu.com/locator/ec2/)
- [AWS RDS Instance Comparison](https://instances.vantage.sh/rds)

### Tertiary (LOW confidence - marked for validation)

**Community Discussions:**
- SSH tunnel setup patterns (multiple GitHub gists and Medium articles) - validated approach but implementation details may vary
- RDS publicly accessible warnings (security blogs) - validated concern through AWS official security best practices

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All components have official documentation and active maintenance through 2026
- Architecture patterns: HIGH - Security group and Nginx configurations verified through AWS and official Nginx docs
- Installation steps: HIGH - NodeSource, PM2, certbot have official installation guides for Ubuntu 22.04
- Common pitfalls: MEDIUM-HIGH - Based on AWS official troubleshooting docs plus community consensus on common mistakes
- Cost estimates: MEDIUM - Based on AWS pricing pages, but actual costs vary by usage

**Research date:** 2026-02-05
**Valid until:** ~30 days (stable infrastructure, but AWS Console UI may change, software versions update)

**Special notes for planner:**
- User is NEW to AWS — plans need tutorial-level detail with screenshots references
- Tight deadline (SIT by Feb 10) — prioritize working solution over perfection
- Manual setup via AWS Console — step-by-step wizard guidance required
- Security group configuration is highest-risk area — needs explicit verification steps
- All commands tested on Ubuntu 22.04 LTS unless otherwise noted
