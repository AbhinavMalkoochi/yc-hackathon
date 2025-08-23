import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Create a new browser session
 */
export const create = mutation({
  args: {
    flowId: v.id("flows"),
    testRunId: v.id("testRuns"),
    sessionId: v.string(),
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
    metadata: v.optional(
      v.object({
        cost: v.optional(v.number()),
        region: v.optional(v.string()),
        sessionType: v.optional(v.string()),
        maxDurationMinutes: v.optional(v.number()),
      }),
    ),
  },
  returns: v.id("browserSessions"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("browserSessions", {
      flowId: args.flowId,
      testRunId: args.testRunId,
      sessionId: args.sessionId,
      status: "initializing",
      browserInfo: args.browserInfo,
      cloudSessionUrl: args.cloudSessionUrl,
      startedAt: Date.now(),
      lastActiveAt: Date.now(),
      metadata: args.metadata,
    });
  },
});

/**
 * Get browser session by ID
 */
export const get = query({
  args: { sessionId: v.id("browserSessions") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("browserSessions"),
      _creationTime: v.number(),
      flowId: v.id("flows"),
      testRunId: v.id("testRuns"),
      sessionId: v.string(),
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
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

/**
 * List sessions by flow
 */
export const listByFlow = query({
  args: { flowId: v.id("flows") },
  returns: v.array(
    v.object({
      _id: v.id("browserSessions"),
      _creationTime: v.number(),
      flowId: v.id("flows"),
      testRunId: v.id("testRuns"),
      sessionId: v.string(),
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
      startedAt: v.optional(v.number()),
      lastActiveAt: v.optional(v.number()),
      terminatedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("browserSessions")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .collect();
  },
});

/**
 * Update session status
 */
export const updateStatus = mutation({
  args: {
    sessionId: v.id("browserSessions"),
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
    terminatedAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: Partial<Doc<"browserSessions">> = {
      status: args.status,
      lastActiveAt: Date.now(),
    };

    if (args.terminatedAt !== undefined) {
      updates.terminatedAt = args.terminatedAt;
    }

    await ctx.db.patch(args.sessionId, updates);
    return null;
  },
});

/**
 * Update last active timestamp
 */
export const updateLastActive = mutation({
  args: { sessionId: v.id("browserSessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      lastActiveAt: Date.now(),
    });
    return null;
  },
});

/**
 * Remove browser session
 */
export const remove = mutation({
  args: { sessionId: v.id("browserSessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.sessionId);
    return null;
  },
});
