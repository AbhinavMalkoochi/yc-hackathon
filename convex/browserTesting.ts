import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ==================== TEST SESSIONS ====================

// Query: Get all test sessions
export const listTestSessions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("testSessions")
      .order("desc")
      .take(args.limit ?? 50);

    return sessions;
  },
});

// Query: Get a specific test session
export const getTestSession = query({
  args: {
    sessionId: v.id("testSessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error(`Test session ${args.sessionId} not found`);
    }

    // Get associated flows
    const flows = await ctx.db
      .query("testFlows")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();

    return {
      ...session,
      flows,
    };
  },
});

// Mutation: Create a new test session
export const createTestSession = mutation({
  args: {
    name: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert("testSessions", {
      name: args.name,
      prompt: args.prompt,
      status: "pending",
      createdAt: new Date().toISOString(),
      totalFlows: 0,
      completedFlows: 0,
    });

    // Log session creation
    await ctx.db.insert("executionLogs", {
      sessionId,
      level: "info",
      message: `Test session created: ${args.name}`,
      timestamp: new Date().toISOString(),
      data: { prompt: args.prompt },
    });

    return sessionId;
  },
});

// Mutation: Update test session status
export const updateTestSessionStatus = mutation({
  args: {
    sessionId: v.id("testSessions"),
    status: v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("ready"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    metadata: v.optional(
      v.object({
        estimatedDuration: v.optional(v.number()),
        actualDuration: v.optional(v.number()),
        errorMessage: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error(`Test session ${args.sessionId} not found`);
    }

    const updateData: any = {
      status: args.status,
    };

    // Set timestamps based on status
    if (args.status === "running" && !session.startedAt) {
      updateData.startedAt = new Date().toISOString();
    } else if (args.status === "completed" || args.status === "failed") {
      updateData.completedAt = new Date().toISOString();
    }

    if (args.metadata) {
      updateData.metadata = args.metadata;
    }

    await ctx.db.patch(args.sessionId, updateData);

    // Log status change
    await ctx.db.insert("executionLogs", {
      sessionId: args.sessionId,
      level: "info",
      message: `Session status changed to: ${args.status}`,
      timestamp: new Date().toISOString(),
      data: { previousStatus: session.status, newStatus: args.status },
    });

    return args.sessionId;
  },
});

// ==================== TEST FLOWS ====================

// Query: Get flows for a session
export const getSessionFlows = query({
  args: {
    sessionId: v.id("testSessions"),
  },
  handler: async (ctx, args) => {
    const flows = await ctx.db
      .query("testFlows")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();

    return flows;
  },
});

// Mutation: Create test flows for a session
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
      const flow = args.flows[i];
      const flowId = await ctx.db.insert("testFlows", {
        sessionId: args.sessionId,
        name: flow.name,
        description: flow.description,
        instructions: flow.instructions,
        approved: false,
        status: "pending",
        order: i + 1,
        createdAt: new Date().toISOString(),
      });
      flowIds.push(flowId);
    }

    // Update session total flows count
    await ctx.db.patch(args.sessionId, {
      totalFlows: args.flows.length,
    });

    // Log flows creation
    await ctx.db.insert("executionLogs", {
      sessionId: args.sessionId,
      level: "info",
      message: `Created ${args.flows.length} test flows`,
      timestamp: new Date().toISOString(),
      data: { flowCount: args.flows.length },
    });

    return flowIds;
  },
});

// Mutation: Update flow approval status
export const updateFlowApproval = mutation({
  args: {
    flowId: v.id("testFlows"),
    approved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const flow = await ctx.db.get(args.flowId);
    if (!flow) {
      throw new Error(`Test flow ${args.flowId} not found`);
    }

    await ctx.db.patch(args.flowId, {
      approved: args.approved,
      status: args.approved ? "approved" : "pending",
    });

    // Log approval change
    await ctx.db.insert("executionLogs", {
      sessionId: flow.sessionId,
      flowId: args.flowId,
      level: "info",
      message: `Flow ${args.approved ? "approved" : "unapproved"}: ${flow.name}`,
      timestamp: new Date().toISOString(),
      data: { approved: args.approved },
    });

    return args.flowId;
  },
});

// ==================== BROWSER SESSIONS ====================

// Query: Get browser sessions for a session
export const getBrowserSessions = query({
  args: {
    sessionId: v.id("testSessions"),
  },
  handler: async (ctx, args) => {
    const browserSessions = await ctx.db
      .query("browserSessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .collect();

    return browserSessions;
  },
});

// Mutation: Create browser session
export const createBrowserSession = mutation({
  args: {
    sessionId: v.id("testSessions"),
    flowId: v.id("testFlows"),
    browserType: v.string(),
  },
  handler: async (ctx, args) => {
    const browserSessionId = await ctx.db.insert("browserSessions", {
      sessionId: args.sessionId,
      flowId: args.flowId,
      browserType: args.browserType,
      status: "initializing",
      startedAt: new Date().toISOString(),
      progress: 0,
    });

    // Log browser session creation
    await ctx.db.insert("executionLogs", {
      sessionId: args.sessionId,
      flowId: args.flowId,
      browserSessionId,
      level: "info",
      message: `Browser session started: ${args.browserType}`,
      timestamp: new Date().toISOString(),
      data: { browserType: args.browserType },
    });

    return browserSessionId;
  },
});

// Mutation: Update browser session status
export const updateBrowserSession = mutation({
  args: {
    browserSessionId: v.id("browserSessions"),
    status: v.optional(
      v.union(
        v.literal("initializing"),
        v.literal("ready"),
        v.literal("running"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("terminated"),
      ),
    ),
    currentUrl: v.optional(v.string()),
    currentAction: v.optional(v.string()),
    progress: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const browserSession = await ctx.db.get(args.browserSessionId);
    if (!browserSession) {
      throw new Error(`Browser session ${args.browserSessionId} not found`);
    }

    const updateData: any = {};

    if (args.status !== undefined) {
      updateData.status = args.status;
      if (
        args.status === "completed" ||
        args.status === "failed" ||
        args.status === "terminated"
      ) {
        updateData.completedAt = new Date().toISOString();
      }
    }

    if (args.currentUrl !== undefined) updateData.currentUrl = args.currentUrl;
    if (args.currentAction !== undefined)
      updateData.currentAction = args.currentAction;
    if (args.progress !== undefined) updateData.progress = args.progress;

    await ctx.db.patch(args.browserSessionId, updateData);

    return args.browserSessionId;
  },
});

// ==================== EXECUTION LOGS ====================

// Query: Get logs for a session
export const getSessionLogs = query({
  args: {
    sessionId: v.id("testSessions"),
    level: v.optional(
      v.union(
        v.literal("debug"),
        v.literal("info"),
        v.literal("warn"),
        v.literal("error"),
      ),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("executionLogs")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId));

    if (args.level) {
      query = query.filter((q) => q.eq(q.field("level"), args.level));
    }

    const logs = await query.order("desc").take(args.limit ?? 100);

    return logs;
  },
});

// Mutation: Add execution log
export const addExecutionLog = mutation({
  args: {
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
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const logId = await ctx.db.insert("executionLogs", {
      sessionId: args.sessionId,
      flowId: args.flowId,
      browserSessionId: args.browserSessionId,
      level: args.level,
      message: args.message,
      timestamp: new Date().toISOString(),
      data: args.data,
    });

    return logId;
  },
});

// ==================== STATISTICS ====================

// Query: Get current system stats
export const getSystemStats = query({
  args: {},
  handler: async (ctx) => {
    // Get latest stats entry
    const latestStats = await ctx.db.query("systemStats").order("desc").first();

    // Calculate current stats
    const activeSessions = await ctx.db
      .query("testSessions")
      .filter((q) => q.eq(q.field("status"), "running"))
      .collect();

    const activeBrowsers = await ctx.db
      .query("browserSessions")
      .filter((q) => q.eq(q.field("status"), "running"))
      .collect();

    return {
      activeSessions: activeSessions.length,
      activeBrowsers: activeBrowsers.length,
      lastUpdated: new Date().toISOString(),
      historical: latestStats,
    };
  },
});

// Mutation: Update system stats
export const updateSystemStats = mutation({
  args: {
    activeSessions: v.number(),
    activeBrowsers: v.number(),
    totalSessionsToday: v.number(),
    totalFlowsExecuted: v.number(),
    averageExecutionTime: v.number(),
    successRate: v.number(),
  },
  handler: async (ctx, args) => {
    const statsId = await ctx.db.insert("systemStats", {
      timestamp: new Date().toISOString(),
      activeSessions: args.activeSessions,
      activeBrowsers: args.activeBrowsers,
      totalSessionsToday: args.totalSessionsToday,
      totalFlowsExecuted: args.totalFlowsExecuted,
      averageExecutionTime: args.averageExecutionTime,
      successRate: args.successRate,
    });

    return statsId;
  },
});
