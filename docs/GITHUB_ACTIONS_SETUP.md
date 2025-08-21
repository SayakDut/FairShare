# GitHub Actions CI/CD Setup Guide

This guide will help you set up the complete CI/CD pipeline for FairShare using GitHub Actions.

## Overview

The CI/CD pipeline includes:
- ✅ **Testing**: Linting, type checking, unit tests
- 🏗️ **Building**: Application compilation and artifact creation
- 🔒 **Security**: Vulnerability scanning and audits
- 🚀 **Deployment**: Automated deployment to Vercel
- 📊 **Performance**: Lighthouse CI for performance monitoring
- 📢 **Notifications**: Slack notifications for deployment status

## Required GitHub Secrets

Navigate to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** and add the following secrets:

### 🔑 Essential Secrets (Required)

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard → Settings → API |
| `DATABASE_URL` | PostgreSQL connection string | Construct from Supabase project details |

### 🚀 Deployment Secrets (Required for Auto-Deploy)

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `VERCEL_TOKEN` | Vercel deployment token | [Vercel Dashboard](https://vercel.com/account/tokens) → Create Token |
| `VERCEL_ORG_ID` | Your Vercel organization ID | Vercel Project Settings → General |
| `VERCEL_PROJECT_ID` | Your Vercel project ID | Vercel Project Settings → General |

### 🔧 Optional Secrets (Enhanced Features)

| Secret Name | Description | How to Get | Purpose |
|-------------|-------------|------------|---------|
| `SNYK_TOKEN` | Snyk security scanning | [Snyk.io](https://snyk.io) → Account Settings → API Token | Security vulnerability scanning |
| `LHCI_GITHUB_APP_TOKEN` | Lighthouse CI token | [GitHub Apps](https://github.com/apps/lighthouse-ci) | Performance monitoring |
| `SLACK_WEBHOOK_URL` | Slack webhook for notifications | Slack → Apps → Incoming Webhooks | Deployment notifications |
| `CODECOV_TOKEN` | Codecov coverage reports | [Codecov.io](https://codecov.io) → Repository Settings | Code coverage tracking |

## Step-by-Step Setup

### 1. Supabase Configuration

1. **Get Supabase Credentials**:
   ```bash
   # Go to https://app.supabase.com
   # Select your project
   # Navigate to Settings → API
   # Copy the following values:
   ```

2. **Add to GitHub Secrets**:
   - `SUPABASE_URL`: `https://your-project-ref.supabase.co`
   - `SUPABASE_ANON_KEY`: Your anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key
   - `DATABASE_URL`: `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`

### 2. Vercel Deployment Setup

1. **Create Vercel Account**: Go to [vercel.com](https://vercel.com) and sign up

2. **Import Your Repository**: 
   - Connect your GitHub repository
   - Deploy once manually to create the project

3. **Get Vercel Credentials**:
   ```bash
   # Get your Vercel token:
   # Go to https://vercel.com/account/tokens
   # Create a new token with appropriate scope
   
   # Get your Organization ID and Project ID:
   # Go to your project in Vercel
   # Settings → General
   # Copy the values from the "Project ID" and "Team ID" sections
   ```

4. **Add to GitHub Secrets**:
   - `VERCEL_TOKEN`: Your Vercel token
   - `VERCEL_ORG_ID`: Your organization/team ID
   - `VERCEL_PROJECT_ID`: Your project ID

### 3. Optional Enhancements

#### Security Scanning with Snyk

1. **Create Snyk Account**: Go to [snyk.io](https://snyk.io)
2. **Get API Token**: Account Settings → API Token
3. **Add Secret**: `SNYK_TOKEN`

#### Performance Monitoring with Lighthouse CI

1. **Install Lighthouse CI GitHub App**: [GitHub Apps](https://github.com/apps/lighthouse-ci)
2. **Configure for your repository**
3. **Get token and add as**: `LHCI_GITHUB_APP_TOKEN`

#### Slack Notifications

1. **Create Slack Webhook**:
   ```bash
   # In Slack:
   # Go to your workspace
   # Apps → Incoming Webhooks
   # Create webhook for your channel
   ```
2. **Add Secret**: `SLACK_WEBHOOK_URL`

#### Code Coverage with Codecov

1. **Create Codecov Account**: Go to [codecov.io](https://codecov.io)
2. **Connect your repository**
3. **Get token and add as**: `CODECOV_TOKEN`

## Workflow Triggers

The CI/CD pipeline runs on:

- **Push to `main`**: Full pipeline + production deployment
- **Push to `develop`**: Full pipeline (no deployment)
- **Pull Requests**: Testing, building, preview deployment

## Pipeline Stages

### 🧪 Testing Stage
- ESLint code linting
- TypeScript type checking
- Unit and integration tests
- Code coverage reporting

### 🏗️ Build Stage
- Prisma client generation
- Next.js application build
- Build artifact upload

### 🔒 Security Stage
- npm audit for vulnerabilities
- Snyk security scanning (if configured)

### 📊 Performance Stage (PR only)
- Lighthouse CI performance testing
- Core Web Vitals monitoring

### 🚀 Deployment Stages
- **Preview**: Automatic preview deployments for PRs
- **Production**: Automatic production deployment on main branch
- **Database**: Schema migrations after successful deployment

## Troubleshooting

### Common Issues

1. **"Secret not found" errors**:
   - Verify secret names match exactly (case-sensitive)
   - Ensure secrets are set at repository level, not organization level

2. **Vercel deployment fails**:
   - Check your Vercel token has correct permissions
   - Verify organization and project IDs are correct
   - Ensure your Vercel project is properly configured

3. **Build failures**:
   - Check that all required environment variables are set
   - Verify Supabase credentials are correct
   - Look at the build logs for specific error messages

4. **Tests failing in CI but passing locally**:
   - Ensure test environment variables are set
   - Check for differences in Node.js versions
   - Verify all dependencies are properly installed

### Debug Steps

1. **Check GitHub Actions logs**:
   - Go to your repository → Actions tab
   - Click on the failed workflow
   - Expand the failing step to see detailed logs

2. **Verify secrets**:
   - Repository Settings → Secrets and variables → Actions
   - Ensure all required secrets are present

3. **Test locally**:
   ```bash
   # Run the same commands locally
   npm ci
   npm run lint
   npm run type-check
   npm run test:ci
   npm run build
   ```

## Security Best Practices

- ✅ Never commit secrets to your repository
- ✅ Use different Supabase projects for development and production
- ✅ Regularly rotate your API keys and tokens
- ✅ Limit token permissions to minimum required scope
- ✅ Monitor your deployment logs for any exposed secrets

## Monitoring and Maintenance

- 📊 Monitor workflow runs in the Actions tab
- 🔄 Update dependencies regularly
- 🔐 Rotate secrets periodically
- 📈 Review performance metrics from Lighthouse CI
- 🛡️ Address security vulnerabilities promptly

## Getting Help

If you encounter issues:

1. Check this guide and the main README.md
2. Review GitHub Actions logs for specific errors
3. Consult the [GitHub Actions documentation](https://docs.github.com/en/actions)
4. Check [Vercel deployment documentation](https://vercel.com/docs)
5. Open an issue in the repository with detailed error information

---

**Happy deploying! 🚀**
