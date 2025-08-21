# Deployment Guide

This guide covers deploying the FairShare application to production using Vercel and Supabase.

## Prerequisites

- Node.js 18+ installed
- Git repository set up
- Vercel account
- Supabase account

## Environment Setup

### 1. Supabase Setup

1. **Create a new Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and anon key

2. **Set up the database**
   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Login to Supabase
   supabase login

   # Link your project
   supabase link --project-ref YOUR_PROJECT_REF

   # Push database schema
   supabase db push
   ```

3. **Configure Row Level Security (RLS)**
   - The RLS policies are included in the migration files
   - Verify they're applied correctly in the Supabase dashboard

4. **Set up Storage**
   - Create storage buckets for receipts and avatars
   - Configure public access policies

### 2. Vercel Deployment

1. **Connect your repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your Git repository
   - Select the Next.js framework preset

2. **Configure environment variables**
   ```bash
   # Required environment variables
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=https://your-domain.vercel.app
   ```

3. **Deploy**
   - Click "Deploy" in Vercel
   - Wait for the build to complete

## Environment Variables

### Required Variables

| Variable | Description | Where to find |
|----------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard > Settings > API |
| `NEXTAUTH_SECRET` | Random secret for NextAuth | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your app's URL | Your Vercel deployment URL |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `VERCEL_URL` | Vercel deployment URL | Auto-set by Vercel |

## Database Migration

The application uses Prisma with Supabase. The database schema is automatically applied during deployment.

### Manual Migration (if needed)

```bash
# Generate Prisma client
npx prisma generate

# Apply database migrations
npx prisma db push

# Seed the database (optional)
npx prisma db seed
```

## Post-Deployment Checklist

### 1. Verify Core Functionality
- [ ] User registration and login
- [ ] Group creation and joining
- [ ] Expense creation and editing
- [ ] Balance calculations
- [ ] Receipt upload and OCR processing
- [ ] Real-time updates

### 2. Test Authentication
- [ ] Email/password login
- [ ] Google OAuth (if configured)
- [ ] Password reset
- [ ] Session persistence

### 3. Test API Endpoints
- [ ] `/api/groups` - Group management
- [ ] `/api/expenses` - Expense management
- [ ] `/api/balances` - Balance calculations
- [ ] `/api/upload/receipt` - File uploads
- [ ] `/api/ocr/process` - OCR processing

### 4. Performance Checks
- [ ] Page load times < 3 seconds
- [ ] API response times < 1 second
- [ ] Image optimization working
- [ ] Real-time updates functioning

## Monitoring and Analytics

### 1. Vercel Analytics
- Enable Vercel Analytics in your project settings
- Monitor Core Web Vitals and performance metrics

### 2. Error Tracking
Consider integrating error tracking services:
- Sentry
- LogRocket
- Bugsnag

### 3. Database Monitoring
- Monitor Supabase dashboard for:
  - Database performance
  - API usage
  - Storage usage
  - Real-time connections

## Scaling Considerations

### 1. Database Optimization
- Add database indexes for frequently queried fields
- Implement database connection pooling
- Consider read replicas for heavy read workloads

### 2. Caching Strategy
- Implement Redis for session storage
- Add CDN for static assets
- Cache API responses where appropriate

### 3. Performance Optimization
- Implement lazy loading for components
- Optimize images and assets
- Use Next.js Image optimization
- Implement service workers for offline functionality

## Security Checklist

### 1. Environment Security
- [ ] All secrets stored in environment variables
- [ ] No sensitive data in client-side code
- [ ] HTTPS enforced
- [ ] CORS properly configured

### 2. Database Security
- [ ] Row Level Security (RLS) enabled
- [ ] Proper user permissions
- [ ] SQL injection protection
- [ ] Data validation on all inputs

### 3. Authentication Security
- [ ] Strong password requirements
- [ ] Rate limiting on auth endpoints
- [ ] Session security
- [ ] OAuth properly configured

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check environment variables are set
   - Verify Node.js version compatibility
   - Check for TypeScript errors

2. **Database Connection Issues**
   - Verify Supabase credentials
   - Check network connectivity
   - Ensure RLS policies are correct

3. **Authentication Problems**
   - Verify NextAuth configuration
   - Check redirect URLs
   - Ensure secrets are properly set

4. **Real-time Issues**
   - Check Supabase real-time settings
   - Verify WebSocket connections
   - Check browser compatibility

### Getting Help

- Check Vercel deployment logs
- Review Supabase logs and metrics
- Use browser developer tools for client-side issues
- Check the application's error boundaries

## Maintenance

### Regular Tasks
- Monitor application performance
- Update dependencies regularly
- Review and rotate secrets
- Backup database regularly
- Monitor storage usage

### Updates and Releases
- Use feature flags for gradual rollouts
- Implement proper CI/CD pipelines
- Test in staging environment first
- Monitor after deployments

## Cost Optimization

### Vercel
- Monitor function execution time
- Optimize bundle size
- Use edge functions where appropriate

### Supabase
- Monitor database usage
- Optimize queries
- Clean up unused data
- Monitor storage usage

This deployment guide should help you successfully deploy and maintain your FairShare application in production.
