# Deployment Setup Guide

## Task 1: Allow SSH from Anywhere (AWS Security Group)

### Steps:

1. **Log into AWS Console**
   - Go to https://console.aws.amazon.com
   - Navigate to **EC2** → **Security Groups** (left sidebar under "Network & Security")

2. **Find Your Security Group**
   - Look for a security group linked to your EC2 instance
   - Instance name: likely something with `radstrat` or `EC2` in the name
   - Click on the Security Group ID (starts with `sg-`)

3. **Edit Inbound Rules**
   - Click the **Inbound rules** tab
   - Click **Edit inbound rules**
   - Look for the **SSH** rule (Type: SSH, Port: 22)
   - Change the **Source** from your current IP to:
     - **Anywhere**: `0.0.0.0/0` (allows SSH from any IP)
     - OR **Your home IP only** (safer): Search "what is my IP" on Google, then use that IP with `/32` (e.g., `1.2.3.4/32`)

4. **Save Changes**
   - Click **Save rules**

### Verification:
After saving, try SSH from your laptop:
```bash
ssh -i ~/.ssh/radstrat-key.pem ubuntu@13.228.99.8
```

---

## Task 2: GitHub Auto-Deploy Setup

I've created `.github/workflows/deploy.yml` for you.

### One-Time Setup (GitHub Secrets):

1. **Get your EC2 SSH key content**
   ```bash
   cat ~/.ssh/radstrat-key.pem | pbcopy
   ```

2. **Add GitHub Secrets**
   - Go to: https://github.com/DigitalxVault/radstrat-v1/settings/secrets/actions
   - Click **New repository secret**
   - Add these 2 secrets:

   | Name | Value |
   |------|-------|
   | `EC2_HOST` | `13.228.99.8` |
   | `EC2_SSH_KEY` | *(paste the SSH key content from step 1)* |

3. **Enable GitHub Actions**
   - Go to: https://github.com/DigitalxVault/radstrat-v1/actions
   - Click **I understand my workflows, go ahead and enable them**

### How It Works:

After setup, every time you push to `main` branch:
```
git add .
git commit -m "feat: ..."
git push origin main
```

GitHub Actions will automatically:
1. SSH into your EC2 server
2. Pull latest code
3. Run `pnpm install` and `pnpm build`
4. Reload PM2 with new code

### Manual Deploy (if needed):
Go to GitHub Actions tab → Click "Deploy to EC2" → Click "Run workflow"

---

## Task 3: Add JWT Secrets to Production Server

Once SSH is working, run these commands:

```bash
# 1. SSH into server
ssh -i ~/.ssh/radstrat-key.pem ubuntu@13.228.99.8

# 2. Edit production env file
sudo nano ~radstrat/.env.production
```

Add these lines to the file:

```bash
JWT_ACCESS_SECRET=DwCgE6eiiSSz6VG1uxjOND5vT1EBOC9iD2ENmJ7Wb6Gc0pHPpe1aPOivsi6zStCL
JWT_REFRESH_SECRET=3HPkjV2q1MeSuFPSBqo7ZV4Boi58EDhQYHBil76fD1sUiZ8f0GGmi3grQAQ5qnW8
JWT_ADMIN_ACCESS_SECRET=EYvXlpb0hDXU0lIHQD6mcEQyg8Uh9hixM_p1FW7iUyxiGUhdk4XFfsYA34F_aO9c
JWT_ADMIN_REFRESH_SECRET=6liEE1BzHxrrhwKnfOXS4-61rF_7Ft38_33bGFSJJx2JOJbmJg6_RsXzAL1_wReN
CORS_ORIGIN=*
```

Save (Ctrl+O, Enter) and exit (Ctrl+X).

```bash
# 3. Deploy
cd /home/ubuntu/radstrat
./deploy.sh

# 4. Verify
pm2 logs radstrat-api --lines 20
curl https://api-radstrat.devsparksbuild.com/docs
```

---

## Summary

| Task | Status |
|------|--------|
| 1. Update Security Group for SSH | **You do this in AWS Console** |
| 2. GitHub Auto-Deploy | ✅ Workflow created, add secrets |
| 3. Add JWT Secrets | **After SSH works** |

Let me know when you've completed Task 1, and I can help with the rest!
