"use client";

import { useState } from "react";
import { orpcClient } from "@/lib/orpc/client";
import {
  MetricCard,
  RevenueChart,
  ModelUsageTable,
  TopTenantsTable,
  RecentActivityTable,
  SystemHealthCard,
} from "@/components/admin";
import {
  MessageSquare,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AIAnalyticsPage() {
  const [timeRange, _setTimeRange] = useState(30); // days

  // Fetch overview stats
  const { data: overview, isLoading: _overviewLoading } = orpcClient.aiAnalytics.getOverview.useQuery();

  // Fetch revenue trends
  const { data: revenueTrends, isLoading: _revenueLoading } = orpcClient.aiAnalytics.getRevenueTrends.useQuery({
    days: timeRange,
  });

  // Fetch usage by model
  const { data: modelUsage, isLoading: _modelUsageLoading } = orpcClient.aiAnalytics.getUsageByModel.useQuery({});

  // Fetch top tenants
  const { data: topTenants, isLoading: _tenantsLoading } = orpcClient.aiAnalytics.getTopTenants.useQuery({
    limit: 10,
    sortBy: "cost",
  });

  // Fetch model popularity
  const { data: modelPopularity, isLoading: _popularityLoading } = orpcClient.aiAnalytics.getModelPopularity.useQuery();

  // Fetch recent activity
  const { data: recentActivity, isLoading: _activityLoading } = orpcClient.aiAnalytics.getRecentActivity.useQuery({
    limit: 20,
  });

  // Fetch system health
  const { data: systemHealth, isLoading: _healthLoading } = orpcClient.aiAnalytics.getSystemHealth.useQuery();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Platform-wide analytics, usage trends, and revenue insights
        </p>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Conversations"
          value={overview?.totalConversations.toLocaleString() ?? "0"}
          description="All AI conversations"
          icon={MessageSquare}
        />
        <MetricCard
          title="Total Messages"
          value={overview?.totalMessages.toLocaleString() ?? "0"}
          description="Messages exchanged"
          icon={MessageSquare}
        />
        <MetricCard
          title="Total Revenue"
          value={`$${overview?.revenue.toFixed(2) ?? "0.00"}`}
          description="From credit purchases"
          icon={DollarSign}
        />
        <MetricCard
          title="Active Tenants"
          value={overview?.activeTenants.toLocaleString() ?? "0"}
          description="Tenants using AI"
          icon={Users}
        />
      </div>

      {/* System Health */}
      {systemHealth && (
        <SystemHealthCard
          messagesLast24h={systemHealth.messagesLast24h}
          avgCostPerMessage={systemHealth.avgCostPerMessage}
          errorRate={systemHealth.errorRate}
          avgTokensPerMessage={systemHealth.avgTokensPerMessage}
        />
      )}

      {/* Tabs for Different Views */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue & Usage</TabsTrigger>
          <TabsTrigger value="models">Model Analytics</TabsTrigger>
          <TabsTrigger value="tenants">Top Tenants</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        {/* Revenue & Usage Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <MetricCard
              title="Total Credit Balance"
              value={`$${overview?.totalBalance.toFixed(2) ?? "0.00"}`}
              description="Across all tenants"
              icon={DollarSign}
            />
            <MetricCard
              title="Total Spent"
              value={`$${overview?.totalSpent.toFixed(2) ?? "0.00"}`}
              description="Lifetime AI usage cost"
              icon={TrendingUp}
            />
          </div>

          {revenueTrends && <RevenueChart data={revenueTrends} />}
        </TabsContent>

        {/* Model Analytics Tab */}
        <TabsContent value="models" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {modelUsage && <ModelUsageTable data={modelUsage} />}
            {modelPopularity && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Model Popularity</h3>
                <div className="grid gap-3">
                  {modelPopularity.slice(0, 5).map((model: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">
                          {model.modelId.split("/")[1] || model.modelId}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {model.conversationCount} conversations • {model.messageCount} messages
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${model.totalCost.toFixed(4)}</p>
                        <p className="text-xs text-muted-foreground">Total cost</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Top Tenants Tab */}
        <TabsContent value="tenants" className="space-y-4">
          {topTenants && <TopTenantsTable data={topTenants} />}
        </TabsContent>

        {/* Recent Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          {recentActivity && <RecentActivityTable data={recentActivity} />}
        </TabsContent>
      </Tabs>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Avg Cost/Conversation"
          value={
            overview && overview.totalConversations > 0
              ? `$${(overview.totalSpent / overview.totalConversations).toFixed(4)}`
              : "$0.00"
          }
          description="Average spend per conversation"
        />
        <MetricCard
          title="Avg Messages/Conversation"
          value={
            overview && overview.totalConversations > 0
              ? (overview.totalMessages / overview.totalConversations).toFixed(1)
              : "0"
          }
          description="Average conversation length"
        />
        <MetricCard
          title="Revenue per Active Tenant"
          value={
            overview && overview.activeTenants > 0
              ? `$${(overview.revenue / overview.activeTenants).toFixed(2)}`
              : "$0.00"
          }
          description="Average revenue per tenant"
        />
      </div>
    </div>
  );
}
