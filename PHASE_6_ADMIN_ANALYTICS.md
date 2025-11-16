# Phase 6: Admin Analytics Dashboard

## Overview

Phase 6 completes the AI integration by adding a comprehensive admin analytics dashboard. This provides platform-wide insights into AI usage, revenue tracking, system health monitoring, and tenant analytics.

## What Was Built

### 1. Analytics API Router (`src/lib/orpc/routers/ai-analytics.ts`)

A complete analytics API with 7 endpoints, all protected by super admin middleware:

#### Endpoints

1. **`getOverview`** - Platform overview statistics
   - Total conversations and messages
   - Total credit balance across all tenants
   - Lifetime spent and purchased credits
   - Total revenue from credit purchases
   - Number of active tenants

2. **`getUsageByModel`** - Model usage breakdown
   - Accepts optional date range filter
   - Groups by model ID
   - Returns total requests, messages, tokens, and cost per model
   - Sorted by request count

3. **`getTopTenants`** - Top tenants by usage
   - Configurable limit (1-50, default 10)
   - Sort by cost, messages, or conversations
   - Enriched with tenant name and statistics
   - Returns spending, purchases, balance, message/conversation counts

4. **`getRevenueTrends`** - Revenue and usage trends
   - Configurable time range (1-365 days, default 30)
   - Daily breakdown of revenue from purchases
   - Daily breakdown of usage costs
   - Sorted chronologically

5. **`getModelPopularity`** - Model popularity ranking
   - Groups by model ID
   - Returns conversation count, message count, total cost
   - Sorted by conversation count

6. **`getRecentActivity`** - Recent conversations
   - Configurable limit (1-100, default 20)
   - Enriched with tenant information
   - Sorted by most recently updated
   - Shows title, model, message count, cost

7. **`getSystemHealth`** - System health metrics
   - Messages in last 24 hours
   - Average cost per message
   - Error rate percentage
   - Average tokens per message

### 2. UI Components (`src/components/admin/`)

Six reusable analytics components:

#### **MetricCard** (`metric-card.tsx`)
- Displays key performance indicators
- Supports optional icon, description, and trend data
- Responsive grid layout
- Color-coded trends (positive/negative)

#### **RevenueChart** (`revenue-chart.tsx`)
- Visualizes revenue vs usage trends
- Horizontal bar chart with dual metrics
- Summary statistics
- Color-coded bars (green for revenue, blue for usage)
- Responsive legend

#### **ModelUsageTable** (`model-usage-table.tsx`)
- Detailed table of model usage statistics
- Shows requests, messages, tokens, cost per model
- Percentage of total cost
- Model provider grouping
- Summary row with totals

#### **TopTenantsTable** (`top-tenants-table.tsx`)
- Ranked table of top tenants
- Shows conversations, messages, spending, purchases, balance
- Status badges (low balance warnings)
- Utilization rate calculation
- Responsive design

#### **RecentActivityTable** (`recent-activity-table.tsx`)
- Recent conversations across all tenants
- Tenant badges
- Model identification
- Time ago formatting
- Cost tracking

#### **SystemHealthCard** (`system-health-card.tsx`)
- System health overview
- Health status badge (Healthy/Warning/Critical)
- Key metrics grid
- Visual health status bar
- Color-coded error rate
- Hourly message rate calculation

### 3. Admin Dashboard Page (`src/app/admin/ai-analytics/page.tsx`)

A comprehensive dashboard with:

- **Overview Section**: 4 metric cards showing total conversations, messages, revenue, and active tenants
- **System Health Section**: Real-time system health monitoring
- **Tabbed Interface**:
  - **Revenue & Usage Tab**: Credit balances, spending, and revenue trends chart
  - **Model Analytics Tab**: Usage by model table and top 5 popular models
  - **Top Tenants Tab**: Ranked list of highest-spending tenants
  - **Recent Activity Tab**: Latest AI conversations across the platform
- **Additional Stats**: Calculated metrics like avg cost/conversation, avg messages/conversation, revenue per tenant

### 4. UI Utilities

Created **Table component** (`src/components/ui/table.tsx`):
- Full shadcn/ui table primitives
- Responsive design
- Hover states and styling
- Support for header, body, footer, rows, cells

## Technical Implementation

### Authentication & Authorization

- **Super Admin Middleware**: All endpoints use `superAdminProcedure` which:
  - Verifies user is authenticated
  - Checks user has an active admin role
  - Validates role is "super_admin"
  - Returns 403 Forbidden if unauthorized

### Data Aggregation

- Uses Drizzle ORM with SQL aggregation functions
- Efficient queries with proper grouping and sorting
- Type-safe SQL with `sql` tagged templates
- Numeric precision handling for currency values

### Type Safety

- Full end-to-end type inference via oRPC
- Client-side hooks auto-generated from router types
- TypeScript interfaces for all data structures
- No manual type casting needed

### Performance Optimizations

- Parallel data fetching with React Query
- Efficient SQL queries with proper indexes
- Conditional rendering to avoid empty states
- Numeric conversion for consistent decimal handling

## File Structure

```
src/
├── lib/orpc/routers/
│   └── ai-analytics.ts          # Analytics API router
├── components/
│   ├── admin/
│   │   ├── metric-card.tsx      # KPI card component
│   │   ├── revenue-chart.tsx    # Revenue/usage chart
│   │   ├── model-usage-table.tsx # Model usage table
│   │   ├── top-tenants-table.tsx # Top tenants table
│   │   ├── recent-activity-table.tsx # Recent activity
│   │   ├── system-health-card.tsx # System health
│   │   └── index.ts             # Exports
│   └── ui/
│       └── table.tsx            # Table primitives
└── app/admin/ai-analytics/
    └── page.tsx                 # Analytics dashboard page
```

## Key Features

### 1. Real-time Analytics
- Live data fetching with React Query
- Automatic cache invalidation
- Loading states for all data

### 2. Multi-dimensional Analysis
- Time-based trends (daily, weekly, monthly)
- Model-based breakdowns
- Tenant-level insights
- System-wide health monitoring

### 3. Revenue Tracking
- Purchase vs usage comparison
- Daily revenue trends
- Per-tenant revenue analysis
- Credit balance monitoring

### 4. System Health Monitoring
- Error rate tracking
- Performance metrics (avg cost, avg tokens)
- 24-hour activity snapshots
- Health status visualization

### 5. Tenant Management
- Identify top spenders
- Monitor low balances
- Track utilization rates
- Conversation and message metrics

## Usage

### Accessing the Dashboard

```typescript
// Navigate to: /admin/ai-analytics
// Requires: Super admin role
```

### API Usage Example

```typescript
// Client-side hook
const { data: overview } = orpcClient.aiAnalytics.getOverview.useQuery();

// Revenue trends with time range
const { data: trends } = orpcClient.aiAnalytics.getRevenueTrends.useQuery({
  days: 30,
});

// Top tenants
const { data: topTenants } = orpcClient.aiAnalytics.getTopTenants.useQuery({
  limit: 10,
  sortBy: "cost",
});
```

### Component Usage Example

```typescript
import { MetricCard, RevenueChart, SystemHealthCard } from "@/components/admin";

// Metric card with trend
<MetricCard
  title="Total Revenue"
  value="$1,234.56"
  icon={DollarSign}
  trend={{ value: 12.5, label: "vs last month" }}
/>

// Revenue chart
<RevenueChart data={revenueTrends} />

// System health
<SystemHealthCard
  messagesLast24h={1234}
  avgCostPerMessage={0.0045}
  errorRate={1.2}
  avgTokensPerMessage={856}
/>
```

## Database Queries

### Overview Query
```sql
-- Total conversations
SELECT COUNT(*)::int FROM ai_conversations;

-- Total credit balance
SELECT COALESCE(SUM(CAST(balance AS NUMERIC)), 0)
FROM ai_credits;
```

### Revenue Trends Query
```sql
SELECT
  DATE(created_at) as date,
  SUM(CASE WHEN type = 'purchase' THEN amount ELSE 0 END) as revenue,
  SUM(CASE WHEN type = 'usage' THEN ABS(amount) ELSE 0 END) as usage
FROM ai_credit_transactions
WHERE created_at >= $1
GROUP BY DATE(created_at)
ORDER BY date;
```

### System Health Query
```sql
-- Messages last 24h
SELECT COUNT(*)::int
FROM ai_messages
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- Error rate
SELECT
  COUNT(CASE WHEN metadata->>'error' IS NOT NULL THEN 1 END) / COUNT(*) * 100
FROM ai_messages
WHERE created_at >= NOW() - INTERVAL '24 hours';
```

## Security Considerations

1. **Super Admin Only**: All analytics endpoints require super admin role
2. **Row-level Security**: Queries aggregate across all tenants (admin view)
3. **No PII Exposure**: Tenant IDs and names only, no user details
4. **SQL Injection Protection**: Parameterized queries via Drizzle ORM
5. **Type Safety**: Full TypeScript validation on inputs and outputs

## Future Enhancements

Potential additions for Phase 7+:

1. **Export Functionality**: CSV/PDF export of analytics data
2. **Email Reports**: Automated daily/weekly reports
3. **Alerts**: Low balance warnings, error rate spikes
4. **Custom Date Ranges**: Calendar picker for flexible date selection
5. **Real-time Updates**: WebSocket for live metrics
6. **Charting Library**: Integration with Recharts or Chart.js for advanced visualizations
7. **Filtering**: Filter by tenant, model, date range
8. **Comparison Views**: Compare periods, tenants, or models
9. **Cost Predictions**: ML-based usage and cost forecasting
10. **API Rate Limiting**: Track and visualize API quota usage

## Integration with Previous Phases

Phase 6 builds on:

- **Phase 1**: Uses ai_conversations, ai_messages, ai_usage_stats tables
- **Phase 2**: Extends oRPC router architecture
- **Phase 3**: Reuses UI component patterns
- **Phase 4**: Analytics for templates, streaming, vision usage
- **Phase 5**: Revenue tracking from billing integration

## Conclusion

Phase 6 completes the AI integration with a powerful admin analytics dashboard. Super admins can now:

- Monitor platform-wide AI usage
- Track revenue and costs
- Identify top tenants
- Monitor system health
- Analyze model popularity
- View recent activity

This provides the insights needed to optimize the AI platform, manage costs, and grow the business.
