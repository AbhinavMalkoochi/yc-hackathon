import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// AI Browser Testing Agent Database Schema
export default defineSchema({
  // Test Sessions - Main entity for tracking test executions (now user-specific)
  testSessions: defineTable({
    userId: v.optional(v.string()), // Clerk user ID - optional for migration
    userEmail: v.optional(v.string()), // User email for easy identification - optional for migration
    name: v.string(),
    prompt: v.string(), // Original user prompt
    status: v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("ready"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    createdAt: v.string(), // ISO timestamp
    startedAt: v.optional(v.string()),
    completedAt: v.optional(v.string()),
    totalFlows: v.number(),
    completedFlows: v.number(),
    metadata: v.optional(
      v.object({
        estimatedDuration: v.optional(v.number()),
        actualDuration: v.optional(v.number()),
        errorMessage: v.optional(v.string()),
      }),
    ),
  }).index("by_userId", ["userId"]),

  // Testing Flows - Individual test scenarios within a session (now user-specific)
  testFlows: defineTable({
    userId: v.optional(v.string()), // Clerk user ID - optional for migration
    sessionId: v.id("testSessions"),
    name: v.string(),
    description: v.string(),
    instructions: v.string(), // Natural language instructions for browser agent
    approved: v.boolean(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    order: v.number(), // Display order
    createdAt: v.string(),
    startedAt: v.optional(v.string()),
    completedAt: v.optional(v.string()),
    result: v.optional(
      v.object({
        success: v.boolean(),
        errorMessage: v.optional(v.string()),
        executionTime: v.optional(v.number()),
        screenshots: v.optional(v.array(v.string())), // URLs or base64
      }),
    ),
  })
    .index("by_sessionId", ["sessionId"])
    .index("by_userId", ["userId"]),

  // Browser Sessions - Track individual browser instances (now user-specific)
  browserSessions: defineTable({
    userId: v.optional(v.string()), // Clerk user ID - optional for migration
    sessionId: v.id("testSessions"),
    flowId: v.id("testFlows"),
    browserUseTaskId: v.string(), // Browser Use Cloud task ID
    browserType: v.string(), // e.g., "chrome", "firefox"
    status: v.union(
      v.literal("initializing"),
      v.literal("ready"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("terminated"),
    ),
    startedAt: v.string(),
    completedAt: v.optional(v.string()),
    currentUrl: v.optional(v.string()),
    currentAction: v.optional(v.string()),
    progress: v.number(), // 0-1
    liveUrl: v.optional(v.string()), // Browser Use Cloud live URL
    metadata: v.optional(
      v.object({
        userAgent: v.optional(v.string()),
        viewport: v.optional(
          v.object({
            width: v.number(),
            height: v.number(),
          }),
        ),
        processId: v.optional(v.string()),
        browserUseData: v.optional(v.any()), // Store Browser Use Cloud response data
      }),
    ),
  })
    .index("by_sessionId", ["sessionId"])
    .index("by_userId", ["userId"])
    .index("by_browserUseTaskId", ["browserUseTaskId"]),

  // Execution Logs - Detailed logs for debugging and monitoring (now user-specific)
  executionLogs: defineTable({
    userId: v.optional(v.string()), // Clerk user ID - optional for migration
    sessionId: v.id("testSessions"),
    flowId: v.optional(v.id("testFlows")),
    browserSessionId: v.optional(v.id("browserSessions")),
    level: v.union(
      v.literal("debug"),
      v.literal("info"),
      v.literal("warn"),
      v.literal("error"),
    ),
    message: v.string(),
    timestamp: v.string(),
    data: v.optional(v.any()), // Additional structured data
  })
    .index("by_sessionId", ["sessionId"])
    .index("by_userId", ["userId"]),

  // System Stats - For monitoring and analytics (global)
  systemStats: defineTable({
    timestamp: v.string(),
    activeSessions: v.number(),
    activeBrowsers: v.number(),
    totalSessionsToday: v.number(),
    totalFlowsExecuted: v.number(),
    averageExecutionTime: v.number(),
    successRate: v.number(), // 0-1
    systemMetrics: v.optional(
      v.object({
        memoryUsage: v.optional(v.number()),
        cpuUsage: v.optional(v.number()),
        diskUsage: v.optional(v.number()),
      }),
    ),
  }),

  // Legacy table for existing functionality
  numbers: defineTable({
    value: v.number(),
  }),
});
