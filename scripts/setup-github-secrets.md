# GitHub Secrets Setup Checklist

Use this checklist to ensure you have all required secrets configured for the CI/CD pipeline.

## 📋 Required Secrets Checklist

Navigate to: **Your GitHub Repository** → **Settings** → **Secrets and variables** → **Actions**

### ✅ Essential Secrets (Required for basic CI/CD)

- [ ] **SUPABASE_URL**
  - Value: `https://your-project-ref.supabase.co`
  - Source: Supabase Dashboard → Settings → API → Project URL

- [ ] **SUPABASE_ANON_KEY**
  - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - Source: Supabase Dashboard → Settings → API → Project API keys → anon public

- [ ] **SUPABASE_SERVICE_ROLE_KEY**
  - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - Source: Supabase Dashboard → Settings → API → Project API keys → service_role
  - ⚠️ **Keep this secret!** It has admin access to your database

- [ ] **DATABASE_URL**
  - Value: `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`
  - Source: Supabase Dashboard → Settings → Database → Connection string
  - Replace `[password]` with your database password

### 🚀 Deployment Secrets (Required for auto-deployment)

- [ ] **VERCEL_TOKEN**
  - Value: Your Vercel API token
  - Source: [Vercel Dashboard](https://vercel.com/account/tokens) → Create Token
  - Scope: Full access or specific to your team

- [ ] **VERCEL_ORG_ID**
  - Value: Your organization/team ID
  - Source: Vercel Project → Settings → General → Team ID
  - Format: `team_xxxxxxxxxxxxxxxxxx` or `prj_xxxxxxxxxxxxxxxxxx`

- [ ] **VERCEL_PROJECT_ID**
  - Value: Your project ID
  - Source: Vercel Project → Settings → General → Project ID
  - Format: `prj_xxxxxxxxxxxxxxxxxx`

### 🔧 Optional Secrets (Enhanced features)

- [ ] **SNYK_TOKEN** (Security scanning)
  - Value: Your Snyk API token
  - Source: [Snyk.io](https://snyk.io) → Account Settings → API Token
  - Purpose: Vulnerability scanning in CI

- [ ] **LHCI_GITHUB_APP_TOKEN** (Performance monitoring)
  - Value: Lighthouse CI GitHub App token
  - Source: [Lighthouse CI GitHub App](https://github.com/apps/lighthouse-ci)
  - Purpose: Performance testing with Lighthouse

- [ ] **SLACK_WEBHOOK_URL** (Deployment notifications)
  - Value: Your Slack webhook URL
  - Source: Slack → Apps → Incoming Webhooks
  - Purpose: Deployment status notifications

- [ ] **CODECOV_TOKEN** (Code coverage)
  - Value: Your Codecov token
  - Source: [Codecov.io](https://codecov.io) → Repository Settings
  - Purpose: Code coverage reporting

## 🔍 How to Get Each Secret

### Supabase Secrets

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy the values:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

5. Get Database URL:
   - Go to **Settings** → **Database**
   - Copy the connection string → `DATABASE_URL`
   - Replace `[YOUR-PASSWORD]` with your actual database password

### Vercel Secrets

1. **Get Vercel Token**:
   - Go to [Vercel Tokens](https://vercel.com/account/tokens)
   - Click "Create Token"
   - Give it a name (e.g., "GitHub Actions")
   - Select appropriate scope
   - Copy the token → `VERCEL_TOKEN`

2. **Get Organization and Project IDs**:
   - Go to your project in Vercel
   - Navigate to **Settings** → **General**
   - Copy **Team ID** → `VERCEL_ORG_ID`
   - Copy **Project ID** → `VERCEL_PROJECT_ID`

### Optional Service Tokens

1. **Snyk Token**:
   - Create account at [Snyk.io](https://snyk.io)
   - Go to Account Settings → API Token
   - Generate and copy token

2. **Lighthouse CI Token**:
   - Install [Lighthouse CI GitHub App](https://github.com/apps/lighthouse-ci)
   - Configure for your repository
   - Copy the provided token

3. **Slack Webhook**:
   - In Slack, go to your workspace
   - Navigate to Apps → Incoming Webhooks
   - Create webhook for desired channel
   - Copy webhook URL

## ✅ Verification Steps

After adding all secrets:

1. **Check Secret Names**: Ensure they match exactly (case-sensitive)
2. **Test Pipeline**: Push a commit to trigger the workflow
3. **Monitor Actions**: Go to Actions tab to see if workflow runs successfully
4. **Check Logs**: If failures occur, check the logs for specific errors

## 🚨 Security Notes

- ✅ Never commit secrets to your repository
- ✅ Use different Supabase projects for development and production
- ✅ Regularly rotate your API keys and tokens
- ✅ Limit token permissions to minimum required scope
- ✅ Monitor your repository for any accidental secret exposure

## 🔧 Troubleshooting

### Common Issues:

1. **"Secret not found" error**:
   - Check secret name spelling (case-sensitive)
   - Ensure secret is set at repository level

2. **Vercel deployment fails**:
   - Verify token has correct permissions
   - Check organization and project IDs are correct

3. **Build fails with environment errors**:
   - Ensure all required Supabase secrets are set
   - Check that values don't have extra spaces or quotes

### Debug Commands:

```bash
# Test your environment locally
npm run lint
npm run type-check
npm run test
npm run build
```

## 📞 Need Help?

- 📖 [GitHub Actions Setup Guide](../docs/GITHUB_ACTIONS_SETUP.md)
- 📖 [Main README](../README.md)
- 🐛 [Open an Issue](https://github.com/your-username/fairshare/issues)

---

**Once all secrets are configured, your CI/CD pipeline will automatically handle testing, building, and deployment! 🚀**
