import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Query: Get user sessions for authenticated user
export const getUserSessions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const sessions = await ctx.db
      .query("testSessions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();

    return sessions;
  },
});

// Query: Get specific user session with flows
export const getUserSession = query({
  args: { sessionId: v.id("testSessions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== identity.subject) {
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

// Mutation: Create new user session
export const createUserSession = mutation({
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

// Mutation: Update session status
export const updateUserSessionStatus = mutation({
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
    if (!session || session.userId !== identity.subject) {
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

// Mutation: Create test flows for a session
export const createUserSessionFlows = mutation({
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

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== identity.subject) {
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

// Mutation: Delete user session
export const deleteUserSession = mutation({
  args: { sessionId: v.id("testSessions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== identity.subject) {
      throw new Error("Session not found or access denied");
    }

    // Delete associated flows
    const flows = await ctx.db
      .query("testFlows")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    for (const flow of flows) {
      await ctx.db.delete(flow._id);
    }

    // Delete associated browser sessions
    const browserSessions = await ctx.db
      .query("browserSessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    for (const browserSession of browserSessions) {
      await ctx.db.delete(browserSession._id);
    }

    // Delete the session
    await ctx.db.delete(args.sessionId);

    // Log session deletion
    await ctx.db.insert("executionLogs", {
      userId: identity.subject,
      sessionId: args.sessionId,
      level: "info",
      message: `Session deleted: ${session.name}`,
      timestamp: new Date().toISOString(),
    });

    return args.sessionId;
  },
});
