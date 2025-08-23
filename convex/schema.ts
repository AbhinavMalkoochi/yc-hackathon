import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Legacy table for existing demo functionality
  numbers: defineTable({
    value: v.number(),
  }),

  // Test Runs - Main orchestration entity
  testRuns: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("generating"),
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled"),
    ),
    prompt: v.string(),
    totalFlows: v.number(),
    completedFlows: v.number(),
    failedFlows: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    metadata: v.optional(
      v.object({
        estimatedDurationMinutes: v.optional(v.number()),
        priority: v.optional(
          v.union(v.literal("low"), v.literal("normal"), v.literal("high")),
        ),
        tags: v.optional(v.array(v.string())),
        environment: v.optional(v.string()),
      }),
    ),
  })
    .index("by_status", ["status"])
    .index("by_creation_time", ["_creationTime"])
    .index("by_status_and_creation_time", ["status", "_creationTime"]),

  // Flows - Individual testing scenarios generated from prompts
  flows: defineTable({
    testRunId: v.id("testRuns"),
    name: v.string(),
    description: v.string(),
    instructions: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled"),
    ),
    order: v.number(),
    estimatedDurationMinutes: v.optional(v.number()),
    actualDurationMs: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    successCriteria: v.optional(v.array(v.string())),
    metadata: v.optional(
      v.object({
        difficulty: v.optional(
          v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
        ),
        category: v.optional(v.string()),
        targetUrl: v.optional(v.string()),
        expectedSteps: v.optional(v.number()),
      }),
    ),
  })
    .index("by_test_run", ["testRunId"])
    .index("by_test_run_and_order", ["testRunId", "order"])
    .index("by_test_run_and_status", ["testRunId", "status"])
    .index("by_status", ["status"]),

  // Browser Sessions - Individual browser instances managed by Browser Use Cloud
  browserSessions: defineTable({
    flowId: v.id("flows"),
    testRunId: v.id("testRuns"),
    sessionId: v.string(), // Browser Use Cloud session ID
    status: v.union(
      v.literal("initializing"),
      v.literal("ready"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("timeout"),
      v.literal("crashed"),
      v.literal("terminated"),
    ),
    browserInfo: v.optional(
      v.object({
        userAgent: v.optional(v.string()),
        viewport: v.optional(
          v.object({
            width: v.number(),
            height: v.number(),
          }),
        ),
        platform: v.optional(v.string()),
      }),
    ),
    cloudSessionUrl: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    lastActiveAt: v.optional(v.number()),
    terminatedAt: v.optional(v.number()),
    metadata: v.optional(
      v.object({
        cost: v.optional(v.number()),
        region: v.optional(v.string()),
        sessionType: v.optional(v.string()),
        maxDurationMinutes: v.optional(v.number()),
      }),
    ),
  })
    .index("by_flow", ["flowId"])
    .index("by_test_run", ["testRunId"])
    .index("by_status", ["status"])
    .index("by_flow_and_status", ["flowId", "status"])
    .index("by_session_id", ["sessionId"]),

  // Session Events - Real-time events from browser sessions
  sessionEvents: defineTable({
    sessionId: v.id("browserSessions"),
    flowId: v.id("flows"),
    testRunId: v.id("testRuns"),
    eventType: v.union(
      v.literal("session_started"),
      v.literal("session_ready"),
      v.literal("navigation"),
      v.literal("click"),
      v.literal("type"),
      v.literal("screenshot"),
      v.literal("console_log"),
      v.literal("error"),
      v.literal("warning"),
      v.literal("success"),
      v.literal("step_completed"),
      v.literal("session_ended"),
    ),
    message: v.string(),
    level: v.union(
      v.literal("info"),
      v.literal("debug"),
      v.literal("warning"),
      v.literal("error"),
      v.literal("success"),
    ),
    data: v.optional(
      v.object({
        url: v.optional(v.string()),
        screenshot: v.optional(v.string()), // Base64 or storage URL
        coordinates: v.optional(
          v.object({
            x: v.number(),
            y: v.number(),
          }),
        ),
        element: v.optional(v.string()),
        value: v.optional(v.string()),
        duration: v.optional(v.number()),
        stackTrace: v.optional(v.string()),
      }),
    ),
    timestamp: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_flow", ["flowId"])
    .index("by_test_run", ["testRunId"])
    .index("by_session_and_timestamp", ["sessionId", "timestamp"])
    .index("by_event_type", ["eventType"])
    .index("by_level", ["level"]),

  // Execution Steps - Detailed step-by-step execution tracking
  executionSteps: defineTable({
    sessionId: v.id("browserSessions"),
    flowId: v.id("flows"),
    testRunId: v.id("testRuns"),
    stepNumber: v.number(),
    action: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("skipped"),
    ),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    durationMs: v.optional(v.number()),
    result: v.optional(
      v.object({
        success: v.boolean(),
        message: v.optional(v.string()),
        screenshot: v.optional(v.string()),
        data: v.optional(
          v.object({
            extractedText: v.optional(v.string()),
            elementFound: v.optional(v.boolean()),
            navigationCompleted: v.optional(v.boolean()),
            formSubmitted: v.optional(v.boolean()),
          }),
        ),
      }),
    ),
    error: v.optional(
      v.object({
        message: v.string(),
        code: v.optional(v.string()),
        stackTrace: v.optional(v.string()),
        retryable: v.optional(v.boolean()),
      }),
    ),
  })
    .index("by_session", ["sessionId"])
    .index("by_flow", ["flowId"])
    .index("by_test_run", ["testRunId"])
    .index("by_session_and_step", ["sessionId", "stepNumber"])
    .index("by_status", ["status"]),
});
