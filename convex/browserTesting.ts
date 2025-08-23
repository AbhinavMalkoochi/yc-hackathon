import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ==================== TEST SESSIONS ====================

// Query: Get all test sessions for authenticated user
export const listTestSessions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const sessions = await ctx.db
      .query("testSessions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(args.limit ?? 50);

    return sessions;
  },
});

// Query: Get a specific test session for authenticated user
export const getTestSession = query({
  args: {
    sessionId: v.id("testSessions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session || (session.userId && session.userId !== identity.subject)) {
      throw new Error("Session not found or access denied");
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

// Mutation: Create a new test session for authenticated user
export const createTestSession = mutation({
  args: {
    name: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const sessionId = await ctx.db.insert("testSessions", {
      userId: identity.subject,
      userEmail: identity.email || "unknown",
      name: args.name,
      prompt: args.prompt,
      status: "pending",
      createdAt: new Date().toISOString(),
      totalFlows: 0,
      completedFlows: 0,
    });

    // Log session creation
    await ctx.db.insert("executionLogs", {
      userId: identity.subject,
      sessionId,
      level: "info",
      message: `Test session created: ${args.name}`,
      timestamp: new Date().toISOString(),
      data: { prompt: args.prompt },
    });

    return sessionId;
  },
});

// Mutation: Update test session status for authenticated user
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
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session || (session.userId && session.userId !== identity.subject)) {
      throw new Error("Session not found or access denied");
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
      userId: identity.subject,
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

// Query: Get flows for a session (authenticated user only)
export const getSessionFlows = query({
  args: {
    sessionId: v.id("testSessions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    // Verify user owns the session
    const session = await ctx.db.get(args.sessionId);
    if (!session || (session.userId && session.userId !== identity.subject)) {
      throw new Error("Session not found or access denied");
    }

    const flows = await ctx.db
      .query("testFlows")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();

    return flows;
  },
});

// Mutation: Create test flows for a session (authenticated user only)
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
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    // Verify user owns the session
    const session = await ctx.db.get(args.sessionId);
    if (!session || (session.userId && session.userId !== identity.subject)) {
      throw new Error("Session not found or access denied");
    }

    const flowIds = [];

    for (let i = 0; i < args.flows.length; i++) {
      const flow = args.flows[i];
      const flowId = await ctx.db.insert("testFlows", {
        userId: identity.subject,
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
      userId: identity.subject,
      sessionId: args.sessionId,
      level: "info",
      message: `Created ${args.flows.length} test flows`,
      timestamp: new Date().toISOString(),
      data: { flowCount: args.flows.length },
    });

    return flowIds;
  },
});

// Mutation: Update flow approval status (authenticated user only)
export const updateFlowApproval = mutation({
  args: {
    flowId: v.id("testFlows"),
    approved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const flow = await ctx.db.get(args.flowId);
    if (!flow || (flow.userId && flow.userId !== identity.subject)) {
      throw new Error("Flow not found or access denied");
    }

    await ctx.db.patch(args.flowId, {
      approved: args.approved,
      status: args.approved ? "approved" : "pending",
    });

    // Log approval change
    await ctx.db.insert("executionLogs", {
      userId: identity.subject,
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

// ==================== STATISTICS ====================

// Query: Get current system stats (public)
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

// ==================== BROWSER SESSIONS (Browser Use Cloud) ====================

// Query: Get active browser sessions for authenticated user
export const getActiveBrowserSessions = query({
  args: {
    sessionId: v.optional(v.id("testSessions")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    let query = ctx.db
      .query("browserSessions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "running"),
          q.eq(q.field("status"), "executing"),
        ),
      );

    // If sessionId is provided, filter by it
    if (args.sessionId) {
      query = query.filter((q) => q.eq(q.field("sessionId"), args.sessionId));
    }

    const activeSessions = await query.collect();

    return activeSessions;
  },
});

// Query: Get all browser sessions for a test session (including completed ones)
export const getAllBrowserSessionsForTestSession = query({
  args: {
    sessionId: v.id("testSessions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    // Verify user owns the test session
    const testSession = await ctx.db.get(args.sessionId);
    if (
      !testSession ||
      (testSession.userId && testSession.userId !== identity.subject)
    ) {
      throw new Error("Session not found or access denied");
    }

    // Get all browser sessions for this test session
    const browserSessions = await ctx.db
      .query("browserSessions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId))
      .order("desc")
      .collect();

    return browserSessions;
  },
});

// Mutation: Create a new browser session for Browser Use Cloud
export const createBrowserSession = mutation({
  args: {
    taskId: v.string(),
    browserSessionId: v.string(),
    liveUrl: v.optional(v.string()),
    flowName: v.string(),
    flowDescription: v.string(),
    instructions: v.string(),
    estimatedTime: v.optional(v.number()),
    sessionId: v.optional(v.id("testSessions")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    try {
      // Check if browser session already exists for this taskId
      const existingSession = await ctx.db
        .query("browserSessions")
        .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
        .filter((q) => q.eq(q.field("userId"), identity.subject))
        .first();

      if (existingSession) {
        console.log(
          `Browser session already exists for taskId: ${args.taskId}`,
        );
        return existingSession._id;
      }

      // Prepare the data object, only including liveUrl if it's not null/undefined
      const insertData: any = {
        userId: identity.subject,
        sessionId: args.sessionId, // Associate with test session
        taskId: args.taskId,
        browserSessionId: args.browserSessionId,
        flowName: args.flowName,
        flowDescription: args.flowDescription,
        instructions: args.instructions,
        status: "executing",
        startedAt: new Date().toISOString(),
        metadata: {
          estimatedTime: args.estimatedTime,
        },
      };

      // Only include liveUrl if it has a valid string value (not null, undefined, or empty string)
      if (
        args.liveUrl &&
        typeof args.liveUrl === "string" &&
        args.liveUrl.trim() !== ""
      ) {
        insertData.liveUrl = args.liveUrl;
      }

      const browserSessionId = await ctx.db.insert(
        "browserSessions",
        insertData,
      );

      // Log browser session creation
      await ctx.db.insert("executionLogs", {
        userId: identity.subject,
        sessionId: args.sessionId, // Include sessionId in logs
        browserSessionId,
        level: "info",
        message: `Browser session created: ${args.flowName}`,
        timestamp: new Date().toISOString(),
        data: {
          taskId: args.taskId,
          browserSessionId: args.browserSessionId,
          flowName: args.flowName,
          sessionId: args.sessionId,
        },
      });

      console.log(
        `Successfully created browser session for taskId: ${args.taskId}, browserSessionId: ${browserSessionId}`,
      );
      return browserSessionId;
    } catch (error) {
      console.error(
        `Failed to create browser session for taskId: ${args.taskId}:`,
        error,
      );
      throw error;
    }
  },
});

// Mutation: Update browser session status and metadata
export const updateBrowserSessionStatus = mutation({
  args: {
    taskId: v.string(),
    status: v.union(
      v.literal("executing"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("terminated"),
    ),
    liveUrl: v.optional(v.string()),
    currentUrl: v.optional(v.string()),
    currentAction: v.optional(v.string()),
    progress: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    // Find the browser session by taskId
    const browserSession = await ctx.db
      .query("browserSessions")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .first();

    if (!browserSession) {
      // Log the missing session for debugging
      console.warn(
        `Browser session not found for taskId: ${args.taskId}, userId: ${identity.subject}`,
      );

      // Instead of throwing an error, return null to indicate session not found
      // This allows the streaming to continue without breaking
      return null;
    }

    const updateData: any = {
      status: args.status,
    };

    // Set completion timestamp for final states
    if (
      args.status === "completed" ||
      args.status === "failed" ||
      args.status === "terminated"
    ) {
      updateData.completedAt = new Date().toISOString();
    }

    // Update optional fields if provided (with proper null checks)
    if (
      args.liveUrl &&
      typeof args.liveUrl === "string" &&
      args.liveUrl.trim() !== ""
    ) {
      updateData.liveUrl = args.liveUrl;
    }
    if (args.currentUrl) updateData.currentUrl = args.currentUrl;
    if (args.currentAction) updateData.currentAction = args.currentAction;
    if (args.progress !== undefined) updateData.progress = args.progress;

    await ctx.db.patch(browserSession._id, updateData);

    // Log status change
    await ctx.db.insert("executionLogs", {
      userId: identity.subject,
      browserSessionId: browserSession._id,
      level: "info",
      message: `Browser session status changed to: ${args.status}`,
      timestamp: new Date().toISOString(),
      data: {
        taskId: args.taskId,
        previousStatus: browserSession.status,
        newStatus: args.status,
        liveUrl: args.liveUrl,
      },
    });

    return browserSession._id;
  },
});

// Mutation: Close/terminate a browser session
export const closeBrowserSession = mutation({
  args: {
    taskId: v.string(),
    status: v.union(
      v.literal("completed"),
      v.literal("failed"),
      v.literal("terminated"),
    ),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    // Find the browser session by taskId
    const browserSession = await ctx.db
      .query("browserSessions")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .first();

    if (!browserSession) {
      // Log the missing session for debugging
      console.warn(
        `Browser session not found for taskId: ${args.taskId}, userId: ${identity.subject}`,
      );

      // Instead of throwing an error, return null to indicate session not found
      // This allows the streaming to continue without breaking
      return null;
    }

    await ctx.db.patch(browserSession._id, {
      status: args.status,
      completedAt: new Date().toISOString(),
    });

    // Log session closure
    await ctx.db.insert("executionLogs", {
      userId: identity.subject,
      browserSessionId: browserSession._id,
      level: args.status === "failed" ? "error" : "info",
      message: `Browser session ${args.status}: ${browserSession.flowName}`,
      timestamp: new Date().toISOString(),
      data: {
        taskId: args.taskId,
        status: args.status,
        errorMessage: args.errorMessage,
      },
    });

    return browserSession._id;
  },
});

// Query: Get browser session by task ID
export const getBrowserSessionByTaskId = query({
  args: {
    taskId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const browserSession = await ctx.db
      .query("browserSessions")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .first();

    return browserSession;
  },
});
