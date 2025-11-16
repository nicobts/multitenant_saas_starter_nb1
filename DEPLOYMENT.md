# Deployment Guide

This guide will walk you through deploying the Multitenant SaaS Starter with AI Integration to production.

## Prerequisites

Before deploying, ensure you have:

- [ ] Fixed oRPC version compatibility issues (see TEST_REPORT.md)
- [ ] PostgreSQL database (Neon, Supabase, or AWS RDS recommended)
- [ ] OpenRouter API key
- [ ] Stripe account (for payments)
- [ ] Domain name (for production)

## 1. Environment Setup

### 1.1 Copy Environment Template

```bash
cp .env.example .env.local
```

### 1.2 Configure Required Variables

Edit `.env.local` and set all required values:

**Database (Required)**
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
POSTGRES_URL=postgresql://user:pass@host:5432/dbname
```

**Authentication (Required)**
```bash
# Generate secret
openssl rand -base64 32

# Add to .env.local
BETTER_AUTH_SECRET=<generated-secret>
BETTER_AUTH_URL=https://yourdomain.com
```

**OpenRouter AI (Required)**
```env
OPENROUTER_API_KEY=<your-key-from-openrouter.ai>
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

**Stripe (Required for billing)**
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## 2. Database Setup

### 2.1 Generate Migrations

```bash
npm run db:generate
```

### 2.2 Push Schema to Database

```bash
npm run db:push
```

### 2.3 Seed AI Models

```bash
npm run db:seed
```

This will populate the `ai_models` table with 12 popular AI models.

## 3. Build & Test Locally

### 3.1 Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 3.2 Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to test locally.

### 3.3 Test Production Build

```bash
npm run build
npm start
```

Fix any build errors before proceeding.

## 4. Deployment Platforms

### Option A: Vercel (Recommended)

**Pros:**
- Zero-config deployment for Next.js
- Automatic HTTPS & CDN
- Preview deployments
- Environment variables UI

**Steps:**

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Add environment variables in Vercel Dashboard:
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.local`
   - Ensure "Production" is checked

4. Redeploy:
```bash
vercel --prod
```

5. Configure custom domain in Vercel Dashboard

**Database:** Use external PostgreSQL (Neon, Supabase, or AWS RDS)

### Option B: Railway

**Pros:**
- Built-in PostgreSQL
- Simple deployment
- Good for MVP

**Steps:**

1. Install Railway CLI:
```bash
npm i -g @railway/cli
```

2. Login:
```bash
railway login
```

3. Initialize:
```bash
railway init
```

4. Add PostgreSQL:
```bash
railway add postgresql
```

5. Set environment variables:
```bash
railway variables set BETTER_AUTH_SECRET=<value>
railway variables set OPENROUTER_API_KEY=<value>
# ... etc
```

6. Deploy:
```bash
railway up
```

### Option C: Docker + Cloud (AWS/GCP/Azure)

**For advanced users**

See `docker-compose.yml` (to be created) for containerization.

## 5. Post-Deployment Configuration

### 5.1 Configure Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET` env var
5. Redeploy

### 5.2 Test Critical Flows

- [ ] User registration
- [ ] AI chat functionality
- [ ] Credit purchase (use Stripe test cards)
- [ ] Admin dashboard access
- [ ] Analytics viewing

### 5.3 Set Up Monitoring

**Sentry (Error Tracking)**:
1. Create project at sentry.io
2. Add `SENTRY_AUTH_TOKEN` and `NEXT_PUBLIC_SENTRY_DSN`
3. Redeploy

**Uptime Monitoring**:
- Use Vercel Analytics, UptimeRobot, or Pingdom

## 6. Security Checklist

Before going live:

- [ ] All environment variables set
- [ ] HTTPS enabled (automatic on Vercel/Railway)
- [ ] Database has SSL enabled
- [ ] Stripe is in live mode (not test mode)
- [ ] CORS configured if needed
- [ ] Rate limiting implemented
- [ ] Content Security Policy (CSP) headers added
- [ ] npm audit vulnerabilities fixed
- [ ] Sentry error tracking configured
- [ ] Regular database backups configured

## 7. Scaling Considerations

### Database

- Use connection pooling (e.g., PgBouncer)
- Add read replicas for analytics queries
- Monitor query performance

### Application

- Vercel automatically scales
- For self-hosted: Use load balancer + multiple instances
- Consider Redis for caching and rate limiting

### Costs

Monitor:
- OpenRouter API costs (set budgets in dashboard)
- Database costs (optimize queries, add indexes)
- Hosting costs (Vercel/Railway usage)

## 8. Maintenance

### Database Migrations

When schema changes:
```bash
npm run db:generate  # Generate migration
npm run db:push      # Apply to production DB
```

### Updating Dependencies

```bash
npm update
npm audit fix
npm run build  # Test build
```

### Monitoring

- Check Sentry for errors
- Monitor Stripe dashboard for payment issues
- Review database performance metrics
- Monitor OpenRouter API usage/costs

## 9. Rollback Procedure

If issues after deployment:

1. **Vercel:**
```bash
# Rollback to previous deployment
vercel rollback
```

2. **Railway:**
```bash
# Redeploy previous version
railway up --service <service-id>
```

3. **Database:**
- Keep backups before migrations
- Test migrations in staging first

## 10. Troubleshooting

### Build Fails

- Check all environment variables are set
- Verify Node.js version (≥20.0.0)
- Check for TypeScript errors
- Review build logs

### Database Connection Issues

- Verify DATABASE_URL is correct
- Check database allows connections from deployment IP
- Ensure SSL is enabled if required

### Stripe Webhooks Not Working

- Verify webhook URL is correct
- Check webhook secret matches
- Review Stripe webhook logs
- Ensure endpoint is publicly accessible

### AI API Errors

- Verify OPENROUTER_API_KEY is valid
- Check API quota/credits
- Review error logs in Sentry

## 11. Support & Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Deployment**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Drizzle ORM**: https://orm.drizzle.team
- **Better Auth**: https://better-auth.com
- **Stripe Docs**: https://stripe.com/docs

## 12. Known Issues

See `TEST_REPORT.md` for current blockers:

- oRPC version compatibility (requires code refactoring)
- Missing OpenRouter helper functions
- ESLint errors in build

**Action Required:** Fix these issues before production deployment!

---

**Last Updated:** November 16, 2025
**Status:** Deployment blocked - See TEST_REPORT.md
