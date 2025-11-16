# 🤖 AI Features Integration Gameplan

**Branch:** `claude/multitenant-saas-starter+ai-1`
**Goal:** Integrate conversational AI capabilities using OpenRouter APIs

---

## 📋 Executive Summary

This gameplan outlines the integration of AI chat capabilities into the multitenant SaaS starter template using **OpenRouter** as the AI gateway. OpenRouter provides access to 100+ AI models (GPT-4, Claude, Llama, Mistral, etc.) through a unified API.

### Why OpenRouter?

- ✅ **100+ models** - Access GPT-4, Claude, Gemini, Llama, Mistral, and more
- ✅ **Unified API** - Single integration for all models
- ✅ **Cost optimization** - Pay only for what you use
- ✅ **Fallback support** - Automatic failover between models
- ✅ **No vendor lock-in** - Switch models anytime
- ✅ **Transparent pricing** - Per-token billing
- ✅ **Streaming support** - Real-time responses

### Core Features to Build

1. **AI Chat Interface** - Beautiful, responsive chat UI
2. **Multi-Model Support** - Select from 100+ AI models
3. **Conversation Management** - Save, load, organize chats
4. **Streaming Responses** - Real-time streaming for better UX
5. **Usage Tracking** - Monitor tokens and costs per tenant
6. **Rate Limiting** - Per-tenant AI usage limits
7. **Prompt Templates** - Pre-built prompts for common tasks
8. **File Attachments** - Vision models support (GPT-4V, Claude 3)
9. **Tenant Isolation** - Each tenant's conversations are isolated
10. **Billing Integration** - Usage-based billing via Stripe

---

## 🏗️ Architecture Overview

```
┌─────────────────┐
│   User (Web)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Next.js App    │
│  (Frontend)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  oRPC Router    │
│  (Backend API)  │
└────────┬────────┘
         │
         ├──────► PostgreSQL (Conversations, Messages)
         │
         └──────► OpenRouter API
                  │
                  ├─► GPT-4 / GPT-3.5
                  ├─► Claude 3 Opus/Sonnet/Haiku
                  ├─► Gemini Pro
                  ├─► Llama 3
                  ├─► Mistral
                  └─► 100+ other models
```

---

## 📦 Phase 1: Foundation (Week 1)

### 1.1 Database Schema Design

**Tables to Create:**

#### `ai_conversations`
```typescript
{
  id: UUID;
  tenantId: UUID;
  userId: UUID;
  title: string;              // Auto-generated or user-defined
  model: string;              // openai/gpt-4, anthropic/claude-3-opus, etc.
  systemPrompt: string | null;
  metadata: JSON;             // Custom data, tags, etc.
  messageCount: number;
  totalTokens: number;
  totalCost: number;          // In cents
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
}
```

#### `ai_messages`
```typescript
{
  id: UUID;
  conversationId: UUID;
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;            // Message text or JSON for function calls
  model: string;              // Actual model used for this message
  tokens: number;             // Token count
  cost: number;               // Cost in cents
  attachments: JSON[];        // File URLs for vision models
  metadata: JSON;             // Model parameters, temperature, etc.
  createdAt: Date;
}
```

#### `ai_usage_stats`
```typescript
{
  id: UUID;
  tenantId: UUID;
  userId: UUID | null;        // null for tenant-wide stats
  date: Date;                 // Daily aggregation
  model: string;
  requestCount: number;
  tokenCount: number;
  cost: number;
  conversationCount: number;
  createdAt: Date;
}
```

#### `ai_models`
```typescript
{
  id: UUID;
  modelId: string;            // openai/gpt-4-turbo
  name: string;               // GPT-4 Turbo
  provider: string;           // OpenAI, Anthropic, etc.
  category: string;           // chat, completion, vision, etc.
  contextWindow: number;      // Max tokens
  pricing: JSON;              // { prompt: 0.01, completion: 0.03 }
  capabilities: string[];     // ['vision', 'function-calling', 'streaming']
  isEnabled: boolean;
  metadata: JSON;
  createdAt: Date;
  updatedAt: Date;
}
```

#### `ai_prompt_templates`
```typescript
{
  id: UUID;
  tenantId: UUID | null;      // null for global templates
  name: string;
  description: string;
  category: string;           // translation, summarization, coding, etc.
  systemPrompt: string;
  userPromptTemplate: string; // With {variable} placeholders
  recommendedModel: string;
  variables: JSON;            // Schema for template variables
  isPublic: boolean;
  usageCount: number;
  createdBy: UUID;
  createdAt: Date;
  updatedAt: Date;
}
```

### 1.2 OpenRouter Integration

**Environment Variables:**
```bash
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

**OpenRouter Client Setup:**
```typescript
// src/lib/ai/openrouter.ts
import OpenAI from 'openai';

export const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: process.env.OPENROUTER_BASE_URL,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL,
    "X-Title": process.env.NEXT_PUBLIC_APP_NAME,
  },
});
```

### 1.3 Model Management

**Fetch Available Models:**
```typescript
// Sync OpenRouter models to database
async function syncModels() {
  const response = await fetch('https://openrouter.ai/api/v1/models');
  const { data } = await response.json();

  for (const model of data) {
    await db.insert(aiModels).values({
      modelId: model.id,
      name: model.name,
      provider: model.id.split('/')[0],
      contextWindow: model.context_length,
      pricing: model.pricing,
      capabilities: detectCapabilities(model),
    }).onConflictDoUpdate({ ... });
  }
}
```

**Model Categories:**
- **Chat Models**: GPT-4, Claude 3, Gemini
- **Fast Models**: GPT-3.5, Haiku, Llama 3
- **Vision Models**: GPT-4V, Claude 3, Gemini Pro Vision
- **Code Models**: GPT-4, Claude 3, CodeLlama
- **Long Context**: Claude 3 (200k), GPT-4-turbo (128k)

---

## 📦 Phase 2: Core Chat API (Week 1-2)

### 2.1 oRPC Router Design

**`src/lib/orpc/routers/ai.ts`**

```typescript
export const aiRouter = or({
  // Conversations
  conversations: {
    list: tenantProcedure.handler(...),
    get: tenantProcedure.input(z.object({ id })).handler(...),
    create: tenantProcedure.input(schema).handler(...),
    update: tenantProcedure.handler(...),
    delete: tenantProcedure.handler(...),
    archive: tenantProcedure.handler(...),
  },

  // Messages & Chat
  messages: {
    list: tenantProcedure.handler(...),
    send: tenantProcedure.input(schema).handler(...),
    sendStream: tenantProcedure.handler(...), // Streaming endpoint
    regenerate: tenantProcedure.handler(...),
  },

  // Models
  models: {
    list: tenantProcedure.handler(...),
    get: tenantProcedure.handler(...),
    search: tenantProcedure.handler(...),
  },

  // Usage & Stats
  usage: {
    getStats: tenantProcedure.handler(...),
    getConversationCost: tenantProcedure.handler(...),
    getTenantUsage: adminProcedure.handler(...),
  },

  // Templates
  templates: {
    list: tenantProcedure.handler(...),
    create: tenantProcedure.handler(...),
    use: tenantProcedure.handler(...),
  },
});
```

### 2.2 Chat Implementation

**Send Message (Non-Streaming):**
```typescript
async function sendMessage({
  conversationId,
  content,
  model = 'openai/gpt-4-turbo',
  temperature = 0.7,
}: SendMessageInput) {
  // 1. Get conversation history
  const messages = await getConversationMessages(conversationId);

  // 2. Add user message to DB
  const userMessage = await db.insert(aiMessages).values({
    conversationId,
    role: 'user',
    content,
  });

  // 3. Call OpenRouter
  const response = await openrouter.chat.completions.create({
    model,
    messages: [
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content },
    ],
    temperature,
  });

  const assistantMessage = response.choices[0].message;

  // 4. Save assistant response
  await db.insert(aiMessages).values({
    conversationId,
    role: 'assistant',
    content: assistantMessage.content,
    model: response.model,
    tokens: response.usage.total_tokens,
    cost: calculateCost(response.usage, model),
  });

  // 5. Update conversation stats
  await updateConversationStats(conversationId, response.usage);

  // 6. Track usage
  await trackUsage(tenantId, userId, model, response.usage);

  return assistantMessage;
}
```

**Send Message (Streaming):**
```typescript
async function* sendMessageStream({
  conversationId,
  content,
  model,
}: SendMessageInput) {
  const messages = await getConversationMessages(conversationId);

  const stream = await openrouter.chat.completions.create({
    model,
    messages: [...messages, { role: 'user', content }],
    stream: true,
  });

  let fullContent = '';
  let totalTokens = 0;

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      fullContent += delta;
      yield delta; // Stream to client
    }
  }

  // Save after streaming completes
  await db.insert(aiMessages).values({
    conversationId,
    role: 'assistant',
    content: fullContent,
    model,
    tokens: totalTokens,
  });
}
```

### 2.3 Rate Limiting & Quotas

**Per-Tenant Limits:**
```typescript
// Check tenant's AI usage quota
async function checkAiQuota(tenantId: string) {
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  });

  const usage = await getMonthlyUsage(tenantId);

  const limits = {
    free: { messages: 100, tokens: 100_000 },
    starter: { messages: 1000, tokens: 1_000_000 },
    pro: { messages: 10000, tokens: 10_000_000 },
    enterprise: { messages: -1, tokens: -1 }, // unlimited
  };

  const limit = limits[tenant.plan];

  if (limit.messages !== -1 && usage.messages >= limit.messages) {
    throw new QuotaExceededError('Monthly message limit reached');
  }

  if (limit.tokens !== -1 && usage.tokens >= limit.tokens) {
    throw new QuotaExceededError('Monthly token limit reached');
  }

  return true;
}
```

**Rate Limiting with Redis:**
```typescript
import { ratelimit } from '@/lib/redis';

// Limit to 60 AI requests per minute per tenant
const aiRateLimit = ratelimit?.ai || {
  limit: async (key: string) => ({
    success: true,
    limit: 60,
    remaining: 60,
    reset: Date.now() + 60000,
  }),
};

// In API handler
const { success } = await aiRateLimit.limit(`ai:${tenantId}`);
if (!success) {
  throw new RateLimitError('Too many AI requests');
}
```

---

## 📦 Phase 3: Frontend UI (Week 2)

### 3.1 Chat Interface Components

**File Structure:**
```
src/components/ai/
├── chat-interface.tsx       # Main chat UI
├── chat-sidebar.tsx         # Conversation list
├── message-list.tsx         # Message display
├── message-input.tsx        # Input with attachments
├── model-selector.tsx       # Model dropdown
├── conversation-settings.tsx
├── prompt-template-picker.tsx
└── usage-indicator.tsx      # Quota display
```

### 3.2 Chat Interface Design

**Key Features:**
- ✅ Real-time streaming responses
- ✅ Markdown rendering with code highlighting
- ✅ Copy code blocks
- ✅ Regenerate responses
- ✅ Edit messages
- ✅ Model switching mid-conversation
- ✅ System prompt editor
- ✅ File attachments (for vision models)
- ✅ Conversation search
- ✅ Export conversations (Markdown, JSON)

**UI Components:**
```typescript
// ChatInterface Component
<div className="flex h-screen">
  {/* Sidebar */}
  <ChatSidebar
    conversations={conversations}
    onSelect={handleSelect}
    onNew={handleNew}
  />

  {/* Main Chat Area */}
  <div className="flex-1 flex flex-col">
    {/* Header */}
    <ChatHeader
      conversation={currentConversation}
      model={selectedModel}
      onModelChange={setSelectedModel}
    />

    {/* Messages */}
    <MessageList
      messages={messages}
      isStreaming={isStreaming}
    />

    {/* Input */}
    <MessageInput
      onSend={handleSend}
      disabled={isLoading}
      model={selectedModel}
    />
  </div>

  {/* Settings Panel */}
  <ConversationSettings
    systemPrompt={systemPrompt}
    temperature={temperature}
    onUpdate={handleUpdate}
  />
</div>
```

### 3.3 Streaming Implementation

**Client-Side Streaming:**
```typescript
'use client';

async function sendStreamingMessage(content: string) {
  const response = await fetch('/api/ai/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId,
      content,
      model: selectedModel,
    }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  let accumulatedText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(Boolean);

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (data.content) {
          accumulatedText += data.content;
          setStreamingContent(accumulatedText);
        }
      }
    }
  }
}
```

---

## 📦 Phase 4: Advanced Features (Week 3)

### 4.1 Prompt Templates

**Pre-built Templates:**
```typescript
const templates = [
  {
    name: "Code Review",
    category: "coding",
    systemPrompt: "You are an expert code reviewer...",
    userPromptTemplate: "Review this {language} code:\n\n{code}",
    variables: ["language", "code"],
    recommendedModel: "openai/gpt-4-turbo",
  },
  {
    name: "Translation",
    category: "translation",
    systemPrompt: "You are a professional translator...",
    userPromptTemplate: "Translate this from {source} to {target}:\n\n{text}",
    variables: ["source", "target", "text"],
    recommendedModel: "anthropic/claude-3-haiku",
  },
  {
    name: "Summarization",
    category: "summarization",
    systemPrompt: "You are an expert at concise summarization...",
    userPromptTemplate: "Summarize this in {length} sentences:\n\n{text}",
    variables: ["length", "text"],
    recommendedModel: "anthropic/claude-3-sonnet",
  },
];
```

**Template Usage UI:**
```typescript
<PromptTemplatePicker
  onSelect={(template) => {
    setSystemPrompt(template.systemPrompt);
    setSelectedModel(template.recommendedModel);
    // Show variable input form
    showTemplateVariables(template.variables);
  }}
/>
```

### 4.2 Vision Support (Image Chat)

**File Upload:**
```typescript
async function sendMessageWithImage({
  conversationId,
  content,
  imageUrl,
  model = 'openai/gpt-4-vision-preview',
}) {
  const response = await openrouter.chat.completions.create({
    model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: content },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      },
    ],
  });

  // Save with attachment metadata
  await db.insert(aiMessages).values({
    conversationId,
    role: 'user',
    content,
    attachments: [{ type: 'image', url: imageUrl }],
  });

  return response;
}
```

**Supported Vision Models:**
- GPT-4 Vision (gpt-4-vision-preview)
- Claude 3 Opus/Sonnet (claude-3-opus, claude-3-sonnet)
- Gemini Pro Vision (google/gemini-pro-vision)

### 4.3 Function Calling (Tool Use)

**Example: Weather Function**
```typescript
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string' },
          unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
        },
        required: ['location'],
      },
    },
  },
];

const response = await openrouter.chat.completions.create({
  model: 'openai/gpt-4-turbo',
  messages,
  tools,
  tool_choice: 'auto',
});

// Handle function calls
if (response.choices[0].message.tool_calls) {
  for (const toolCall of response.choices[0].message.tool_calls) {
    const result = await executeFunction(
      toolCall.function.name,
      JSON.parse(toolCall.function.arguments)
    );

    // Send result back to model
    messages.push({
      role: 'function',
      name: toolCall.function.name,
      content: JSON.stringify(result),
    });
  }
}
```

### 4.4 Conversation Export

**Export Formats:**
```typescript
// Export as Markdown
function exportAsMarkdown(conversation: Conversation) {
  let md = `# ${conversation.title}\n\n`;
  md += `Model: ${conversation.model}\n`;
  md += `Created: ${conversation.createdAt}\n\n`;
  md += `---\n\n`;

  for (const message of conversation.messages) {
    md += `**${message.role}**: ${message.content}\n\n`;
  }

  return md;
}

// Export as JSON
function exportAsJSON(conversation: Conversation) {
  return JSON.stringify(conversation, null, 2);
}

// Export as PDF (using library)
async function exportAsPDF(conversation: Conversation) {
  // Use jsPDF or similar
}
```

---

## 📦 Phase 5: Usage Tracking & Billing (Week 3-4)

### 5.1 Cost Calculation

**Token-Based Pricing:**
```typescript
function calculateCost(
  usage: { prompt_tokens: number; completion_tokens: number },
  model: string
) {
  const pricing = getModelPricing(model);

  const promptCost = (usage.prompt_tokens / 1000) * pricing.prompt;
  const completionCost = (usage.completion_tokens / 1000) * pricing.completion;

  return promptCost + completionCost;
}

// Example pricing (per 1k tokens)
const pricing = {
  'openai/gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
  'openai/gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },
  'anthropic/claude-3-opus': { prompt: 0.015, completion: 0.075 },
  'anthropic/claude-3-haiku': { prompt: 0.00025, completion: 0.00125 },
};
```

### 5.2 Usage Dashboard

**Analytics Page: `/dashboard/ai-usage`**
```typescript
<UsageDashboard>
  {/* Overview Cards */}
  <StatsGrid>
    <StatCard
      title="Total Messages"
      value={stats.totalMessages}
      trend="+12% from last month"
    />
    <StatCard
      title="Total Tokens"
      value={stats.totalTokens.toLocaleString()}
    />
    <StatCard
      title="Total Cost"
      value={`$${(stats.totalCost / 100).toFixed(2)}`}
    />
    <StatCard
      title="Quota Used"
      value={`${stats.quotaPercentage}%`}
      progress={stats.quotaPercentage}
    />
  </StatsGrid>

  {/* Usage Charts */}
  <ChartsSection>
    <TokenUsageChart data={stats.dailyUsage} />
    <ModelDistributionChart data={stats.modelBreakdown} />
    <CostTrendChart data={stats.costHistory} />
  </ChartsSection>

  {/* Recent Conversations */}
  <RecentConversations conversations={stats.recent} />
</UsageDashboard>
```

### 5.3 Stripe Metered Billing

**Track Usage for Billing:**
```typescript
// After each API call
await stripe.billingMeters.eventStreams.create({
  customer: tenant.stripeCustomerId,
  meter: 'ai_tokens',
  value: response.usage.total_tokens,
  timestamp: Math.floor(Date.now() / 1000),
});

// Create metered price
const price = await stripe.prices.create({
  currency: 'usd',
  billing_scheme: 'tiered',
  recurring: {
    interval: 'month',
    usage_type: 'metered',
  },
  tiers: [
    { up_to: 100000, unit_amount_decimal: '0' },      // Free tier
    { up_to: 1000000, unit_amount_decimal: '0.001' }, // $1 per 1k tokens
    { up_to: 'inf', unit_amount_decimal: '0.0008' },  // Volume discount
  ],
});
```

---

## 📦 Phase 6: Admin & Monitoring (Week 4)

### 6.1 Super Admin AI Panel

**Admin Routes:**
- `/admin/ai/overview` - Platform-wide AI usage
- `/admin/ai/conversations` - All conversations
- `/admin/ai/models` - Model management
- `/admin/ai/costs` - Cost breakdown by tenant

**Admin Endpoints:**
```typescript
adminRouter.ai = {
  getPlatformUsage: superAdminProcedure.handler(...),
  getTopConsumers: superAdminProcedure.handler(...),
  getModelStats: superAdminProcedure.handler(...),
  setTenantQuota: superAdminProcedure.handler(...),
  disableModelForTenant: superAdminProcedure.handler(...),
};
```

### 6.2 Monitoring & Alerts

**Track Metrics:**
```typescript
// High-cost conversations
if (conversationCost > 10.00) {
  await sendAlert({
    type: 'high_cost_conversation',
    tenantId,
    conversationId,
    cost: conversationCost,
  });
}

// Quota warnings
if (usagePercentage > 80) {
  await sendNotification({
    userId,
    type: 'quota_warning',
    title: 'AI Usage Alert',
    message: `You've used ${usagePercentage}% of your monthly AI quota`,
  });
}

// Error tracking
if (apiError) {
  await Sentry.captureException(apiError, {
    tags: {
      model,
      tenantId,
      conversationId,
    },
  });
}
```

---

## 🔒 Security & Best Practices

### 7.1 Security Measures

**Input Validation:**
```typescript
const messageSchema = z.object({
  content: z.string().min(1).max(10000), // Limit message length
  model: z.string().refine(isValidModel),
  temperature: z.number().min(0).max(2).optional(),
  systemPrompt: z.string().max(5000).optional(),
});
```

**Content Filtering:**
```typescript
// Use OpenRouter's content filtering
async function checkContent(content: string) {
  // OpenRouter has built-in content moderation
  // You can also add custom checks
  const hasInappropriate = await moderationCheck(content);
  if (hasInappropriate) {
    throw new Error('Content violates usage policy');
  }
}
```

**Rate Limiting:**
```typescript
// Per-user rate limit
const userLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'), // 20 messages per minute
});

// Per-tenant rate limit
const tenantLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 per minute
});
```

### 7.2 Data Privacy

**Tenant Isolation:**
```typescript
// ALWAYS scope by tenantId
const conversations = await db.query.aiConversations.findMany({
  where: and(
    eq(aiConversations.tenantId, tenantId),
    eq(aiConversations.userId, userId)
  ),
});
```

**Data Retention:**
```typescript
// Auto-delete old conversations
async function cleanupOldConversations() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 days

  await db.delete(aiConversations).where(
    and(
      eq(aiConversations.isArchived, true),
      lt(aiConversations.updatedAt, cutoffDate)
    )
  );
}
```

**PII Protection:**
```typescript
// Don't log message content in production
logger.info('AI request', {
  conversationId,
  model,
  tokenCount,
  // Do NOT log: content
});
```

---

## 📊 Performance Optimization

### 8.1 Caching

**Cache Model List:**
```typescript
// Cache for 1 hour
const models = await getCached('ai:models', async () => {
  return await db.query.aiModels.findMany({
    where: eq(aiModels.isEnabled, true),
  });
}, 3600);
```

**Cache Conversation Metadata:**
```typescript
// Cache conversation list (not messages)
const conversations = await getCached(
  `ai:conversations:${tenantId}:${userId}`,
  async () => {
    return await db.query.aiConversations.findMany({
      where: and(
        eq(aiConversations.tenantId, tenantId),
        eq(aiConversations.userId, userId)
      ),
      orderBy: desc(aiConversations.lastMessageAt),
      limit: 50,
    });
  },
  300 // 5 minutes
);
```

### 8.2 Database Optimization

**Indexes:**
```sql
CREATE INDEX idx_conversations_tenant_user
  ON ai_conversations(tenant_id, user_id);

CREATE INDEX idx_conversations_last_message
  ON ai_conversations(last_message_at DESC);

CREATE INDEX idx_messages_conversation
  ON ai_messages(conversation_id, created_at);

CREATE INDEX idx_usage_stats_tenant_date
  ON ai_usage_stats(tenant_id, date);
```

**Pagination:**
```typescript
// Cursor-based pagination for messages
const messages = await db.query.aiMessages.findMany({
  where: and(
    eq(aiMessages.conversationId, conversationId),
    cursor ? lt(aiMessages.id, cursor) : undefined
  ),
  orderBy: desc(aiMessages.createdAt),
  limit: 50,
});
```

---

## 🧪 Testing Strategy

### 9.1 Unit Tests

```typescript
describe('AI Chat', () => {
  it('should send message and save to DB', async () => {
    const response = await sendMessage({
      conversationId: 'test-id',
      content: 'Hello, AI!',
      model: 'openai/gpt-3.5-turbo',
    });

    expect(response.content).toBeDefined();

    const messages = await db.query.aiMessages.findMany({
      where: eq(aiMessages.conversationId, 'test-id'),
    });

    expect(messages).toHaveLength(2); // user + assistant
  });

  it('should calculate cost correctly', () => {
    const cost = calculateCost(
      { prompt_tokens: 1000, completion_tokens: 500 },
      'openai/gpt-4-turbo'
    );

    expect(cost).toBe(0.025); // $0.025
  });

  it('should enforce rate limits', async () => {
    // Send 21 messages rapidly
    const promises = Array(21).fill(null).map(() =>
      sendMessage({ ... })
    );

    await expect(Promise.all(promises)).rejects.toThrow('Rate limit');
  });
});
```

### 9.2 E2E Tests

```typescript
test('complete chat flow', async ({ page }) => {
  // Navigate to AI chat
  await page.goto('/dashboard/ai');

  // Create new conversation
  await page.click('button:has-text("New Chat")');

  // Select model
  await page.click('[data-testid="model-selector"]');
  await page.click('text=GPT-3.5 Turbo');

  // Send message
  await page.fill('[data-testid="message-input"]', 'Hello!');
  await page.click('[data-testid="send-button"]');

  // Wait for response
  await page.waitForSelector('[data-testid="assistant-message"]');

  // Verify message appears
  const messages = await page.locator('[data-testid="message"]').count();
  expect(messages).toBeGreaterThanOrEqual(2);
});
```

---

## 📚 Documentation Tasks

### 10.1 User Documentation

**Create:**
- AI Chat Guide (`docs/ai-chat-guide.md`)
- Model Selection Guide
- Prompt Engineering Tips
- Usage & Billing FAQ
- Video Tutorials

### 10.2 Developer Documentation

**Create:**
- API Reference
- Database Schema Docs
- Rate Limiting Guide
- Cost Optimization Guide
- Integration Examples

---

## 🚀 Deployment Checklist

### Pre-Launch

- [ ] Set up OpenRouter account and API key
- [ ] Configure environment variables
- [ ] Run database migrations
- [ ] Sync available models from OpenRouter
- [ ] Set up rate limiting (Redis)
- [ ] Configure Stripe metered billing
- [ ] Set up monitoring and alerts
- [ ] Test all AI models
- [ ] Load test streaming endpoints
- [ ] Review security measures

### Launch

- [ ] Enable AI features for beta users
- [ ] Monitor usage and costs closely
- [ ] Gather user feedback
- [ ] Adjust quotas based on usage
- [ ] Document common issues
- [ ] Create support materials

### Post-Launch

- [ ] Analyze usage patterns
- [ ] Optimize costs (model selection)
- [ ] Add popular prompt templates
- [ ] Implement user-requested features
- [ ] Scale infrastructure as needed

---

## 💰 Cost Estimation

### Development Costs

**Time Estimates:**
- Phase 1 (Foundation): 40 hours
- Phase 2 (Core API): 60 hours
- Phase 3 (Frontend): 80 hours
- Phase 4 (Advanced): 40 hours
- Phase 5 (Billing): 30 hours
- Phase 6 (Admin): 30 hours
- Testing & Polish: 40 hours

**Total: ~320 hours (~8 weeks)**

### Operating Costs (Monthly)

**Example Usage (100 active users):**
- Average: 50 messages/user/month = 5,000 messages
- Average: 500 tokens/message = 2.5M tokens
- Avg model: Mix of GPT-3.5 and GPT-4
- Estimated cost: **$50-200/month**

**With proper caching and model selection, costs can be minimized.**

---

## 🎯 Success Metrics

### KPIs to Track

**Usage:**
- Daily/Monthly Active Users
- Messages per user
- Conversations per user
- Avg conversation length

**Quality:**
- User satisfaction (feedback)
- Response time (streaming)
- Error rate
- Regeneration rate

**Business:**
- AI feature adoption rate
- Upgrade rate (due to AI)
- Cost per user
- Revenue per AI feature

**Technical:**
- API latency (p50, p95, p99)
- Uptime
- Token efficiency
- Cache hit rate

---

## 🔮 Future Enhancements

### Phase 7+ (Future)

1. **Voice Chat**
   - Text-to-Speech (OpenAI TTS)
   - Speech-to-Text (Whisper)
   - Real-time voice conversations

2. **AI Agents**
   - Custom AI agents per tenant
   - Agent marketplace
   - Workflow automation

3. **Fine-Tuned Models**
   - Upload training data
   - Fine-tune on OpenRouter
   - Custom models per tenant

4. **Collaborative Chat**
   - Share conversations
   - Team chat rooms
   - Real-time collaboration

5. **API Access**
   - Public API for AI features
   - Webhook integrations
   - Zapier integration

6. **Advanced Analytics**
   - Sentiment analysis
   - Topic modeling
   - User behavior insights

7. **Mobile App**
   - iOS & Android apps
   - Offline mode
   - Push notifications

---

## 📋 Implementation Checklist

### Week 1
- [ ] Create database schemas
- [ ] Set up OpenRouter client
- [ ] Implement model sync
- [ ] Build core oRPC router
- [ ] Test basic chat flow

### Week 2
- [ ] Implement streaming
- [ ] Add rate limiting
- [ ] Build chat UI components
- [ ] Implement conversation management
- [ ] Test end-to-end

### Week 3
- [ ] Add prompt templates
- [ ] Implement vision support
- [ ] Add function calling
- [ ] Build usage tracking
- [ ] Set up Stripe billing

### Week 4
- [ ] Build admin panel
- [ ] Add monitoring/alerts
- [ ] Write documentation
- [ ] Complete testing
- [ ] Deploy to staging

---

## 🎓 Resources

### OpenRouter
- [OpenRouter Docs](https://openrouter.ai/docs)
- [API Reference](https://openrouter.ai/docs/api-reference)
- [Model List](https://openrouter.ai/models)

### AI/ML
- [OpenAI Cookbook](https://cookbook.openai.com/)
- [Anthropic Claude Docs](https://docs.anthropic.com/)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)

### Libraries
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [LangChain](https://js.langchain.com/)
- [OpenAI Node SDK](https://github.com/openai/openai-node)

---

## ✅ Summary

This gameplan provides a comprehensive roadmap for integrating AI chat capabilities into the multitenant SaaS starter using OpenRouter. The implementation is designed to be:

- **Scalable**: Multi-tenant architecture with proper isolation
- **Cost-Effective**: Usage tracking and optimization
- **Secure**: Rate limiting, content filtering, data privacy
- **User-Friendly**: Beautiful UI with streaming responses
- **Flexible**: Support for 100+ models via OpenRouter

**Estimated Timeline:** 8 weeks for full implementation
**Estimated Cost:** $50-200/month for 100 active users

Ready to start building! 🚀

---

**Next Steps:**
1. Review and approve this gameplan
2. Set up OpenRouter account
3. Begin Phase 1 implementation
4. Iterate based on feedback

**Questions or modifications needed?** Let's discuss!
