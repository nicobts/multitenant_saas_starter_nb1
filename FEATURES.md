# 🚀 Features Documentation

Complete guide to the advanced features in this multitenant SaaS starter.

---

## 📢 Notifications System

A comprehensive notification system with in-app notifications, preferences, and real-time updates.

### Features

- ✅ In-app notification center with badge count
- ✅ Notification types: invites, mentions, updates, alerts, security, billing
- ✅ Mark as read/unread
- ✅ Bulk mark all as read
- ✅ Delete notifications
- ✅ Notification preferences per user
- ✅ Channel preferences (email, push, in-app)
- ✅ Type-specific preferences
- ✅ Action buttons with deep links
- ✅ Time-based expiration
- ✅ Tenant-scoped notifications

### Database Schema

#### Notifications Table
```typescript
{
  id: UUID;
  userId: UUID;              // Target user
  tenantId: UUID | null;     // Optional tenant context
  type: string;              // invite, mention, update, alert, etc.
  title: string;
  message: string;
  data: JSON;                // Flexible data (actionUrl, icon, severity, etc.)
  read: boolean;
  readAt: Date | null;
  createdAt: Date;
  expiresAt: Date | null;    // Optional expiration
}
```

#### Notification Preferences Table
```typescript
{
  id: UUID;
  userId: UUID;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  preferences: JSON;         // Type-specific preferences
  createdAt: Date;
  updatedAt: Date;
}
```

### API Endpoints

All endpoints are available at `/api/notifications.*`:

#### `list`
Get user's notifications with pagination.

```typescript
const { data } = orpc.notifications.list.useQuery({
  limit: 20,
  offset: 0,
  unreadOnly: false,
});
```

Returns:
```typescript
{
  items: Notification[];
  unreadCount: number;
  hasMore: boolean;
}
```

#### `markAsRead`
Mark a single notification as read.

```typescript
const mutation = orpc.notifications.markAsRead.useMutation();
mutation.mutate({ id: "notification-id" });
```

#### `markAllAsRead`
Mark all unread notifications as read.

```typescript
const mutation = orpc.notifications.markAllAsRead.useMutation();
mutation.mutate();
```

#### `delete`
Delete a notification.

```typescript
const mutation = orpc.notifications.delete.useMutation();
mutation.mutate({ id: "notification-id" });
```

#### `getPreferences`
Get user's notification preferences.

```typescript
const { data } = orpc.notifications.getPreferences.useQuery();
```

#### `updatePreferences`
Update notification preferences.

```typescript
const mutation = orpc.notifications.updatePreferences.useMutation();
mutation.mutate({
  emailEnabled: true,
  preferences: {
    invites: true,
    mentions: true,
    marketing: false,
  },
});
```

#### `create`
Create a new notification (for testing or system notifications).

```typescript
const mutation = orpc.notifications.create.useMutation();
mutation.mutate({
  type: "update",
  title: "New feature released!",
  message: "Check out our latest update",
  data: {
    actionUrl: "/changelog",
    actionText: "View changelog",
    severity: "info",
  },
});
```

### Usage Example

#### In Components

```typescript
"use client";

import { orpc } from "@/lib/orpc/client";

export function MyComponent() {
  const { data } = orpc.notifications.list.useQuery({
    limit: 10,
    unreadOnly: true,
  });

  return (
    <div>
      {data?.items.map((notif) => (
        <div key={notif.id}>{notif.title}</div>
      ))}
    </div>
  );
}
```

#### Sending Notifications (Server-side)

```typescript
import { db } from "@/db";
import { notifications } from "@/db/schema";

// Send notification to user
await db.insert(notifications).values({
  userId: "user-id",
  tenantId: "tenant-id", // optional
  type: "invite",
  title: "Team Invitation",
  message: "You've been invited to join Acme Corp",
  data: {
    actionUrl: "/invitations/accept/123",
    actionText: "Accept Invitation",
    severity: "info",
  },
});
```

### Notification Center Component

The `NotificationCenter` component provides a complete UI:

```typescript
import { NotificationCenter } from "@/components/notification-center";

// In your layout or header
<NotificationCenter />
```

Features:
- Bell icon with unread count badge
- Popover dropdown with notification list
- Mark as read/delete actions
- "Mark all as read" button
- Link to full notifications page
- Settings link

---

## 🔐 Super Admin Dashboard

A comprehensive admin panel for platform management with tenant oversight, feature flags, and impersonation capabilities.

### Access Control

Only users with the `super_admin` role can access `/admin/*` routes.

#### Grant Super Admin Access

```typescript
// Via API
const mutation = orpc.admin.grantAdminRole.useMutation();
mutation.mutate({
  userId: "user-id",
  role: "super_admin",
  permissions: ["*"], // All permissions
});

// Via Database
await db.insert(adminRoles).values({
  userId: "user-id",
  role: "super_admin",
  isActive: true,
  permissions: ["*"],
});
```

### Database Schema

#### Admin Roles Table
```typescript
{
  id: UUID;
  userId: UUID;
  role: "admin" | "super_admin";
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Feature Flags Table
```typescript
{
  id: UUID;
  tenantId: UUID | null;     // null = global flag
  key: string;
  enabled: boolean;
  config: JSON;              // Feature-specific configuration
  createdAt: Date;
  updatedAt: Date;
}
```

#### Impersonation Logs Table
```typescript
{
  id: UUID;
  adminId: UUID;
  targetUserId: UUID;
  tenantId: UUID | null;
  reason: string;
  ipAddress: string;
  userAgent: string;
  startedAt: Date;
  endedAt: Date | null;
}
```

#### Platform Metrics Table
```typescript
{
  id: UUID;
  date: Date;
  metricType: string;        // daily_active_users, revenue, signups, etc.
  value: number;
  metadata: JSON;            // Breakdown and additional data
  createdAt: Date;
}
```

### API Endpoints

All endpoints available at `/api/admin.*` (requires super_admin role):

#### Tenant Management

**`listTenants`** - List all tenants with stats
```typescript
const { data } = orpc.admin.listTenants.useQuery({
  limit: 50,
  offset: 0,
  search: "acme",
});
```

**`getTenant`** - Get tenant details with members and feature flags
```typescript
const { data } = orpc.admin.getTenant.useQuery({
  id: "tenant-id",
});
```

**`updateTenant`** - Update tenant settings
```typescript
const mutation = orpc.admin.updateTenant.useMutation();
mutation.mutate({
  id: "tenant-id",
  data: {
    plan: "pro",
    maxUsers: 50,
    isActive: true,
  },
});
```

#### Feature Flags

**`setFeatureFlag`** - Enable/disable feature for tenant
```typescript
const mutation = orpc.admin.setFeatureFlag.useMutation();
mutation.mutate({
  tenantId: "tenant-id", // or null for global
  key: "advanced_analytics",
  enabled: true,
  config: {
    limit: 1000,
    options: ["export", "custom_reports"],
  },
});
```

**`getFeatureFlags`** - Get all flags for tenant
```typescript
const { data } = orpc.admin.getFeatureFlags.useQuery({
  tenantId: "tenant-id",
});
```

#### Impersonation

**`startImpersonation`** - Begin impersonating a user
```typescript
const mutation = orpc.admin.startImpersonation.useMutation();
mutation.mutate({
  userId: "target-user-id",
  reason: "Customer reported issue with dashboard, investigating",
});
```

**`endImpersonation`** - End impersonation session
```typescript
const mutation = orpc.admin.endImpersonation.useMutation();
mutation.mutate({
  logId: "log-id",
});
```

**`getImpersonationLogs`** - View impersonation history
```typescript
const { data } = orpc.admin.getImpersonationLogs.useQuery({
  limit: 50,
  offset: 0,
});
```

#### Analytics & Metrics

**`getOverviewStats`** - Get platform overview
```typescript
const { data } = orpc.admin.getOverviewStats.useQuery();

// Returns:
{
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  newTenantsThisMonth: number;
  tenantsByPlan: Record<string, number>;
}
```

**`getMetrics`** - Get time series metrics
```typescript
const { data } = orpc.admin.getMetrics.useQuery({
  metricType: "signups",
  startDate: "2024-01-01T00:00:00Z",
  endDate: "2024-12-31T23:59:59Z",
});
```

#### Admin Role Management

**`grantAdminRole`** - Grant admin access
```typescript
const mutation = orpc.admin.grantAdminRole.useMutation();
mutation.mutate({
  userId: "user-id",
  role: "super_admin",
  permissions: ["tenants.manage", "users.impersonate"],
});
```

**`revokeAdminRole`** - Revoke admin access
```typescript
const mutation = orpc.admin.revokeAdminRole.useMutation();
mutation.mutate({ userId: "user-id" });
```

**`listAdmins`** - List all active admins
```typescript
const { data } = orpc.admin.listAdmins.useQuery();
```

### Admin Dashboard Pages

#### `/admin`
- Overview stats (tenants, users, signups)
- Distribution charts
- Quick actions

#### `/admin/tenants`
- List all tenants
- Search and filter
- View tenant details
- Edit tenant settings

#### `/admin/feature-flags`
- Manage feature flags
- Per-tenant or global flags
- Feature configuration

#### `/admin/impersonation`
- View impersonation logs
- Start new impersonation session
- Audit trail

### Using Feature Flags

#### Check if feature is enabled:

```typescript
import { db } from "@/db";
import { featureFlags } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function hasFeature(
  tenantId: string,
  featureKey: string
): Promise<boolean> {
  // Check tenant-specific flag
  const flag = await db.query.featureFlags.findFirst({
    where: and(
      eq(featureFlags.tenantId, tenantId),
      eq(featureFlags.key, featureKey)
    ),
  });

  if (flag) {
    return flag.enabled;
  }

  // Check global flag
  const globalFlag = await db.query.featureFlags.findFirst({
    where: and(
      sql`${featureFlags.tenantId} IS NULL`,
      eq(featureFlags.key, featureKey)
    ),
  });

  return globalFlag?.enabled || false;
}

// Usage
const hasAnalytics = await hasFeature(tenant.id, "advanced_analytics");
if (hasAnalytics) {
  // Show analytics features
}
```

### Security Considerations

#### Impersonation
- Always log impersonation sessions
- Require reason for audit trail
- Record IP address and user agent
- Limit impersonation duration
- Notify user after impersonation ends

#### Admin Access
- Use principle of least privilege
- Regularly audit admin list
- Implement 2FA for admin accounts
- Log all admin actions
- Review impersonation logs regularly

---

## 🎯 Best Practices

### Notifications

1. **Don't spam users**
   - Use notification preferences
   - Batch notifications when possible
   - Implement digest emails for low-priority updates

2. **Make notifications actionable**
   - Include `actionUrl` and `actionText`
   - Deep link to relevant page
   - Clear next steps

3. **Clean up old notifications**
   - Set `expiresAt` for time-sensitive notifications
   - Implement automatic cleanup job
   - Archive after 30-90 days

4. **Performance**
   - Index userId and read status
   - Paginate notification lists
   - Cache unread count

### Super Admin

1. **Protect admin routes**
   - Middleware check for admin role
   - Server-side validation
   - Regular security audits

2. **Audit everything**
   - Log all admin actions
   - Track impersonation sessions
   - Monitor feature flag changes

3. **Feature flags**
   - Start with global flags
   - Override per tenant as needed
   - Document flag purposes
   - Clean up unused flags

4. **Impersonation**
   - Always require reason
   - Limit session duration
   - Visual indicator when impersonating
   - Auto-logout after inactivity

---

## 📊 Metrics to Track

### Notifications
- Notification delivery rate
- Read rate by type
- Time to read
- Action click-through rate
- User preference patterns

### Admin
- Active tenants over time
- Churn rate
- Plan distribution
- Support session frequency (impersonation)
- Feature flag adoption

---

## 🔧 Customization

### Adding Notification Types

1. Update schema type enum:
```typescript
// src/db/schema/notifications.ts
type: z.enum([
  "invite",
  "mention",
  "update",
  "alert",
  "welcome",
  "billing",
  "security",
  "system",
  "custom_type", // Add here
]),
```

2. Add to preferences:
```typescript
preferences: {
  // ...
  custom_type: z.boolean().optional(),
}
```

3. Send notification:
```typescript
await db.insert(notifications).values({
  userId: "user-id",
  type: "custom_type",
  title: "Custom Notification",
  message: "Your custom message",
});
```

### Adding Admin Permissions

1. Define permissions in config:
```typescript
// src/lib/admin/permissions.ts
export const PERMISSIONS = {
  TENANTS_MANAGE: "tenants.manage",
  USERS_IMPERSONATE: "users.impersonate",
  FEATURE_FLAGS_MANAGE: "feature_flags.manage",
  // Add more...
} as const;
```

2. Check permissions in middleware:
```typescript
export function hasPermission(
  adminRole: AdminRole,
  permission: string
): boolean {
  return (
    adminRole.permissions.includes("*") ||
    adminRole.permissions.includes(permission)
  );
}
```

---

## 🚀 Future Enhancements

### Notifications
- [ ] Real-time notifications (WebSockets/SSE)
- [ ] Push notifications (web + mobile)
- [ ] Email notification digests
- [ ] SMS notifications (Twilio)
- [ ] Notification templates
- [ ] A/B test notification copy
- [ ] Notification analytics dashboard

### Super Admin
- [ ] Advanced analytics dashboards
- [ ] Tenant health scores
- [ ] Automated alerts for issues
- [ ] Bulk operations on tenants
- [ ] Export/import tenant data
- [ ] Custom reports builder
- [ ] API usage tracking
- [ ] Cost attribution per tenant

---

## 📚 Related Documentation

- [README.md](./README.md) - Project overview
- [GAMEPLAN.md](./GAMEPLAN.md) - Implementation roadmap
- [INTERNATIONALIZATION.md](./INTERNATIONALIZATION.md) - i18n guide
- [TEST_REPORT.md](./TEST_REPORT.md) - Validation results

---

**Questions or issues?** Open a GitHub issue or check the documentation!
