import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Query: Get browser sessions for a specific test session
export const getBrowserSessions = query({
  args: { sessionId: v.id("testSessions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    // Verify user owns the session
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== identity.subject) {
      throw new Error("Session not found or access denied");
    }

    const browserSessions = await ctx.db
      .query("browserSessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .collect();

    return browserSessions;
  },
});

// Query: Get all browser sessions for authenticated user
export const getUserBrowserSessions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const browserSessions = await ctx.db
      .query("browserSessions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();

    // Get associated session and flow data
    const enrichedSessions = await Promise.all(
      browserSessions.map(async (browserSession) => {
        const session = await ctx.db.get(browserSession.sessionId);
        const flow = await ctx.db.get(browserSession.flowId);

        return {
          ...browserSession,
          sessionName: session?.name || "Unknown Session",
          flowName: flow?.name || "Unknown Flow",
          flowInstructions: flow?.instructions || "",
        };
      }),
    );

    return enrichedSessions;
  },
});

// Query: Get browser sessions for a specific session
export const getBrowserSessionsBySessionId = query({
  args: { sessionId: v.id("testSessions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    // Verify user owns the session
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== identity.subject) {
      throw new Error("Session not found or access denied");
    }

    const browserSessions = await ctx.db
      .query("browserSessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .collect();

    // Get associated flow data
    const enrichedSessions = await Promise.all(
      browserSessions.map(async (browserSession) => {
        const flow = await ctx.db.get(browserSession.flowId);

        return {
          ...browserSession,
          sessionName: session.name,
          flowName: flow?.name || "Unknown Flow",
          flowInstructions: flow?.instructions || "",
        };
      }),
    );

    return enrichedSessions;
  },
});

// Query: Get browser session by Browser Use task ID
export const getBrowserSessionByTaskId = query({
  args: { taskId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const browserSession = await ctx.db
      .query("browserSessions")
      .withIndex("by_browserUseTaskId", (q) =>
        q.eq("browserUseTaskId", args.taskId),
      )
      .first();

    if (!browserSession || browserSession.userId !== identity.subject) {
      throw new Error("Browser session not found or access denied");
    }

    // Get associated session and flow data
    const session = await ctx.db.get(browserSession.sessionId);
    const flow = await ctx.db.get(browserSession.flowId);

    return {
      ...browserSession,
      sessionName: session?.name || "Unknown Session",
      flowName: flow?.name || "Unknown Flow",
      flowInstructions: flow?.instructions || "",
    };
  },
});

// Mutation: Create browser session
export const createBrowserSession = mutation({
  args: {
    sessionId: v.id("testSessions"),
    flowId: v.id("testFlows"),
    browserUseTaskId: v.string(),
    liveUrl: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    // Verify user owns the session and flow
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== identity.subject) {
      throw new Error("Session not found or access denied");
    }

    const flow = await ctx.db.get(args.flowId);
    if (!flow || flow.userId !== identity.subject) {
      throw new Error("Flow not found or access denied");
    }

    const browserSessionId = await ctx.db.insert("browserSessions", {
      userId: identity.subject,
      sessionId: args.sessionId,
      flowId: args.flowId,
      browserUseTaskId: args.browserUseTaskId,
      browserType: "chrome", // Default to chrome for Browser Use Cloud
      status: "initializing",
      startedAt: new Date().toISOString(),
      progress: 0,
      liveUrl: args.liveUrl,
      metadata: args.metadata,
    });

    // Log browser session creation
    await ctx.db.insert("executionLogs", {
      userId: identity.subject,
      sessionId: args.sessionId,
      flowId: args.flowId,
      browserSessionId,
      level: "info",
      message: `Browser session created with task ID: ${args.browserUseTaskId}`,
      timestamp: new Date().toISOString(),
      data: { browserUseTaskId: args.browserUseTaskId, liveUrl: args.liveUrl },
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
    liveUrl: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const browserSession = await ctx.db.get(args.browserSessionId);
    if (!browserSession || browserSession.userId !== identity.subject) {
      throw new Error("Browser session not found or access denied");
    }

    const updateData: any = {};

    if (args.status !== undefined) {
      updateData.status = args.status;

      // Set completion timestamp if completed or failed
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
    if (args.liveUrl !== undefined) updateData.liveUrl = args.liveUrl;
    if (args.metadata !== undefined) {
      updateData.metadata = {
        ...browserSession.metadata,
        ...args.metadata,
      };
    }

    await ctx.db.patch(args.browserSessionId, updateData);

    // Log status change if status was updated
    if (args.status !== undefined) {
      await ctx.db.insert("executionLogs", {
        userId: identity.subject,
        sessionId: browserSession.sessionId,
        flowId: browserSession.flowId,
        browserSessionId: args.browserSessionId,
        level: "info",
        message: `Browser session status changed to: ${args.status}`,
        timestamp: new Date().toISOString(),
        data: {
          previousStatus: browserSession.status,
          newStatus: args.status,
          progress: args.progress,
        },
      });
    }

    return args.browserSessionId;
  },
});

// Mutation: Delete browser session
export const deleteBrowserSession = mutation({
  args: { browserSessionId: v.id("browserSessions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const browserSession = await ctx.db.get(args.browserSessionId);
    if (!browserSession || browserSession.userId !== identity.subject) {
      throw new Error("Browser session not found or access denied");
    }

    // Delete associated execution logs
    const logs = await ctx.db
      .query("executionLogs")
      .filter((q) => q.eq(q.field("browserSessionId"), args.browserSessionId))
      .collect();

    for (const log of logs) {
      await ctx.db.delete(log._id);
    }

    // Delete the browser session
    await ctx.db.delete(args.browserSessionId);

    // Log deletion
    await ctx.db.insert("executionLogs", {
      userId: identity.subject,
      sessionId: browserSession.sessionId,
      level: "info",
      message: `Browser session deleted: ${browserSession.browserUseTaskId}`,
      timestamp: new Date().toISOString(),
      data: { browserUseTaskId: browserSession.browserUseTaskId },
    });

    return args.browserSessionId;
  },
});
