# Multitenant SaaS Starter Template

A production-ready, state-of-the-art multitenant SaaS starter template built with modern technologies and best practices.

## Features

### Core Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS, Radix UI
- **Backend**: PostgreSQL, Drizzle ORM
- **API**: oRPC (type-safe RPC)
- **Authentication**: Better Auth
- **Internationalization**: next-intl (EN, IT, DE)

### Production Features
- ✅ **Multitenancy**: Built-in support for subdomain and custom domain routing
- ✅ **Authentication**: Email/password + social auth (Google, GitHub)
- ✅ **Payments**: Stripe integration with subscription management
- ✅ **Email**: Resend + React Email for transactional emails
- ✅ **Monitoring**: Sentry for error tracking and performance monitoring
- ✅ **Caching & Rate Limiting**: Upstash Redis
- ✅ **File Uploads**: Uploadthing integration
- ✅ **Testing**: Vitest (unit) + Playwright (E2E)
- ✅ **CI/CD**: GitHub Actions workflow
- ✅ **Docker**: Production-ready containerization
- ✅ **Type Safety**: End-to-end type safety with TypeScript
- ✅ **Code Quality**: ESLint, Prettier, Husky

## Project Structure

```
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Homepage
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   └── providers.tsx     # Context providers
│   ├── db/                   # Database
│   │   ├── schema/          # Drizzle schemas
│   │   └── index.ts         # Database client
│   ├── lib/                 # Utilities
│   │   ├── auth/           # Authentication
│   │   ├── email/          # Email templates
│   │   ├── orpc/           # oRPC routers
│   │   ├── redis/          # Redis & rate limiting
│   │   ├── stripe/         # Stripe integration
│   │   ├── tenant/         # Multitenancy utils
│   │   └── utils.ts        # Shared utilities
│   ├── i18n/               # Internationalization
│   └── env.ts              # Environment validation
├── messages/               # i18n translations
├── e2e/                   # E2E tests
├── drizzle.config.ts      # Drizzle configuration
├── docker-compose.yml     # Docker setup
└── Dockerfile             # Production Docker image
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL
- pnpm/npm/yarn

### 1. Clone and Install

```bash
git clone <your-repo>
cd multitenant-saas-starter
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and fill in your environment variables:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `BETTER_AUTH_SECRET`: Generate with `openssl rand -base64 32`
- `BETTER_AUTH_URL`: Your app URL
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`: Stripe keys
- `RESEND_API_KEY`: Resend API key
- `EMAIL_FROM`: Sender email address

### 3. Database Setup

```bash
# Generate migrations
npm run db:generate

# Apply migrations
npm run db:migrate

# (Optional) Run Drizzle Studio
npm run db:studio
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Multitenancy

This template supports two types of tenant routing:

### 1. Subdomain Routing
Access tenants via subdomain:
- `tenant1.yourdomain.com`
- `tenant2.yourdomain.com`

For local development:
- `tenant1.localhost:3000`

### 2. Custom Domain Routing
Each tenant can have a custom domain:
- `company.com` → Tenant A
- `startup.io` → Tenant B

## Database Schema

The multitenancy is implemented using row-level isolation:

- **tenants**: Tenant/organization data
- **users**: User accounts
- **tenant_members**: User-to-tenant relationships with roles
- **projects**: Example tenant-scoped resource
- **invitations**: Team member invitations

All tenant-scoped resources include a `tenantId` foreign key for isolation.

## API Development

The template uses oRPC for type-safe APIs:

```typescript
// Server-side (src/lib/orpc/routers/example.ts)
export const exampleRouter = or({
  list: tenantProcedure
    .input(z.object({ limit: z.number() }))
    .handler(async ({ input, context }) => {
      // Access context.tenant, context.user, context.db
      return await context.db.query.projects.findMany({
        where: eq(projects.tenantId, context.tenant.id),
        limit: input.limit,
      });
    }),
});

// Client-side
const { data } = orpc.example.list.useQuery({ limit: 10 });
```

## Testing

### Unit Tests (Vitest)
```bash
npm test
npm run test:ui  # with UI
```

### E2E Tests (Playwright)
```bash
npm run test:e2e
```

## Deployment

### Using Docker

```bash
# Build and run with Docker Compose
docker-compose up

# Build production image
docker build -t saas-starter .
```

### Environment Variables for Production

Ensure all environment variables are set in your deployment platform:
- Vercel, Railway, or similar
- Set up PostgreSQL and Redis instances
- Configure Stripe webhooks
- Set up Sentry project

## Payment Integration

The template includes Stripe subscription management:

1. Configure Stripe products and prices
2. Add price IDs to `.env`:
   ```
   STRIPE_STARTER_PRICE_ID=price_xxx
   STRIPE_PRO_PRICE_ID=price_xxx
   ```
3. Set up webhook endpoint: `/api/webhooks/stripe`

## Email Templates

Located in `src/lib/email/templates/`:
- Welcome emails
- Team invitations
- Password resets (extend as needed)

Built with React Email for easy customization.

## Internationalization

Supported languages:
- English (default)
- Italian
- German

Add translations in `messages/{locale}.json`

## Code Quality

### Linting
```bash
npm run lint
```

### Formatting
```bash
npm run format
npm run format:check
```

### Pre-commit Hooks
Husky is configured to run linting and formatting before commits.

## Architecture Decisions

### Why Multitenancy?
- **Subdomain routing**: Branded experience per tenant
- **Row-level isolation**: Simpler than schema-per-tenant
- **Scalability**: Easy to scale horizontally

### Why oRPC?
- Full type safety from backend to frontend
- Better DX than tRPC for this use case
- Built-in React Query integration

### Why Better Auth?
- Modern, lightweight auth solution
- Built for Next.js App Router
- Flexible and extensible

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - feel free to use this template for your projects!

## Support

For issues and questions:
- Create an issue in the repository
- Check existing documentation

## Roadmap

- [ ] Add more payment providers
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] GraphQL API option
- [ ] Advanced RBAC
- [ ] Audit logs
- [ ] Data export/import

---

Built with ❤️ using modern web technologies
