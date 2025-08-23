# Convex Database Documentation

## Overview

Convex provides real-time database functionality directly integrated into the Next.js frontend. It handles all data persistence, real-time subscriptions, and business logic for the AI Browser Testing Agent.

## Architecture Principles

- **Frontend-First**: Convex runs directly in React components using hooks
- **Real-time Subscriptions**: Automatic UI updates when data changes
- **Type Safety**: Full TypeScript support with generated types
- **Serverless Functions**: Database logic runs in Convex cloud functions

## Database Schema

### Test Sessions (`testSessions`)

Main entity for tracking test executions:

```typescript
testSessions: defineTable({
  name: v.string(), // Human-readable session name
  prompt: v.string(), // Original user prompt
  status: v.union(
    // Session status
    v.literal("pending"),
    v.literal("generating"),
    v.literal("ready"),
    v.literal("running"),
    v.literal("completed"),
    v.literal("failed"),
  ),
  createdAt: v.string(), // ISO timestamp
  startedAt: v.optional(v.string()), // When execution started
  completedAt: v.optional(v.string()), // When execution completed
  totalFlows: v.number(), // Total number of flows
  completedFlows: v.number(), // Number of completed flows
  metadata: v.optional(
    v.object({
      // Additional session data
      estimatedDuration: v.optional(v.number()),
      actualDuration: v.optional(v.number()),
      errorMessage: v.optional(v.string()),
    }),
  ),
});
```

### Test Flows (`testFlows`)

Individual test steps within a session:

```typescript
testFlows: defineTable({
  sessionId: v.id("testSessions"), // Parent session reference
  name: v.string(), // Flow name
  description: v.string(), // Flow description
  instructions: v.string(), // Detailed execution instructions
  approved: v.boolean(), // User approval status
  status: v.union(
    // Flow execution status
    v.literal("pending"),
    v.literal("running"),
    v.literal("completed"),
    v.literal("failed"),
  ),
  order: v.number(), // Execution order
  createdAt: v.string(), // ISO timestamp
  // ... additional flow metadata
}).index("by_sessionId", ["sessionId"]);
```

### Browser Sessions (`browserSessions`)

Active browser instances:

```typescript
browserSessions: defineTable({
  sessionId: v.id("testSessions"), // Parent session
  flowId: v.optional(v.id("testFlows")), // Current flow
  status: v.union(
    // Browser status
    v.literal("starting"),
    v.literal("ready"),
    v.literal("running"),
    v.literal("idle"),
    v.literal("stopped"),
    v.literal("error"),
  ),
  browserType: v.string(), // Browser type (chrome, firefox, etc.)
  startedAt: v.string(), // Start timestamp
  lastActivity: v.string(), // Last activity timestamp
  // ... browser metadata
}).index("by_sessionId", ["sessionId"]);
```

### Execution Logs (`executionLogs`)

Detailed execution logging:

```typescript
executionLogs: defineTable({
  sessionId: v.id("testSessions"), // Parent session
  flowId: v.optional(v.id("testFlows")), // Related flow
  browserSessionId: v.optional(v.id("browserSessions")), // Related browser
  level: v.union(
    // Log level
    v.literal("info"),
    v.literal("warning"),
    v.literal("error"),
    v.literal("debug"),
  ),
  message: v.string(), // Log message
  timestamp: v.string(), // ISO timestamp
  data: v.optional(v.any()), // Additional log data
}).index("by_sessionId", ["sessionId"]);
```

### System Statistics (`systemStats`)

System performance metrics:

```typescript
systemStats: defineTable({
  timestamp: v.string(), // ISO timestamp
  activeSessions: v.number(), // Number of active sessions
  activeBrowsers: v.number(), // Number of active browsers
  totalFlowsExecuted: v.number(), // Cumulative flows executed
  // ... performance metrics
});
```

## Database Functions

### Queries (Read Operations)

```typescript
// Get list of test sessions
export const listTestSessions = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db.query("testSessions").order("desc").take(args.limit);
  },
});

// Get session with flows
export const getTestSession = query({
  args: { sessionId: v.id("testSessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    const flows = await ctx.db
      .query("testFlows")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    return { ...session, flows };
  },
});
```

### Mutations (Write Operations)

```typescript
// Create new test session
export const createTestSession = mutation({
  args: { name: v.string(), prompt: v.string() },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert("testSessions", {
      name: args.name,
      prompt: args.prompt,
      status: "pending",
      createdAt: new Date().toISOString(),
      totalFlows: 0,
      completedFlows: 0,
    });
    return sessionId;
  },
});

// Create test flows for session
export const createTestFlows = mutation({
  args: {
    sessionId: v.id("testSessions"),
    flows: v.array(
      v.object({
        name: v.string(),
        description: v.string(),
        instructions: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const flowIds = [];
    for (let i = 0; i < args.flows.length; i++) {
      const flowId = await ctx.db.insert("testFlows", {
        sessionId: args.sessionId,
        ...args.flows[i],
        approved: false,
        status: "pending",
        order: i + 1,
        createdAt: new Date().toISOString(),
      });
      flowIds.push(flowId);
    }
    return flowIds;
  },
});
```

## React Integration

### Using Convex Hooks

```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function TestPage() {
  // Real-time data queries
  const sessions = useQuery(api.browserTesting.listTestSessions, { limit: 10 });
  const selectedSession = useQuery(
    api.browserTesting.getTestSession,
    selectedSessionId ? { sessionId: selectedSessionId } : "skip"
  );

  // Database mutations
  const createSession = useMutation(api.browserTesting.createTestSession);
  const createFlows = useMutation(api.browserTesting.createTestFlows);

  // Handle form submission
  const handleSubmit = async () => {
    const sessionId = await createSession({ name, prompt });
    await createFlows({ sessionId, flows });
  };

  // Render with real-time data
  return (
    <div>
      {sessions?.map(session => (
        <div key={session._id}>{session.name}</div>
      ))}
    </div>
  );
}
```

### Benefits of Direct Integration

- **Real-time Updates**: UI automatically updates when data changes
- **Type Safety**: Full TypeScript support with generated types
- **Optimistic Updates**: Immediate UI feedback with rollback on errors
- **Offline Support**: Built-in offline functionality and sync
- **No API Layer**: Direct database operations without REST endpoints

## Development Workflow

1. **Schema Definition**: Define tables in `convex/schema.ts`
2. **Function Implementation**: Create queries/mutations in `convex/browserTesting.ts`
3. **Type Generation**: Run `npx convex dev` to generate TypeScript types
4. **React Integration**: Use hooks in components for real-time data

## Performance Considerations

- **Indexes**: Efficient querying with proper indexes (e.g., `by_sessionId`)
- **Pagination**: Use `.take()` and pagination for large datasets
- **Real-time Subscriptions**: Automatic optimization of subscription queries
- **Caching**: Built-in query caching and invalidation

## Security & Validation

- **Input Validation**: All function arguments validated with Convex validators
- **Type Safety**: Runtime type checking with TypeScript integration
- **Access Control**: Function-level access control (future implementation)
- **Data Consistency**: ACID transactions with automatic rollback on errors

## Deployment

- **Serverless**: Convex functions run in serverless environment
- **Global Distribution**: Automatic global deployment for low latency
- **Real-time Infrastructure**: Built-in WebSocket infrastructure for subscriptions
- **Automatic Scaling**: Scales automatically based on usage

## Monitoring & Debugging

- **Dashboard**: Convex dashboard for monitoring function performance
- **Logs**: Built-in logging with function execution traces
- **Metrics**: Performance metrics and query optimization suggestions
- **Real-time Debugging**: Live debugging of function executions
