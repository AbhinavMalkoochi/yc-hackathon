import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

/**
 * Log a session event
 */
export const log = mutation({
  args: {
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
        screenshot: v.optional(v.string()),
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
  },
  returns: v.id("sessionEvents"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("sessionEvents", {
      sessionId: args.sessionId,
      flowId: args.flowId,
      testRunId: args.testRunId,
      eventType: args.eventType,
      message: args.message,
      level: args.level,
      data: args.data,
      timestamp: Date.now(),
    });
  },
});

/**
 * List events for a session with pagination
 */
export const listBySession = query({
  args: {
    sessionId: v.id("browserSessions"),
    paginationOpts: paginationOptsValidator,
    level: v.optional(
      v.union(
        v.literal("info"),
        v.literal("debug"),
        v.literal("warning"),
        v.literal("error"),
        v.literal("success"),
      ),
    ),
  },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("sessionEvents"),
        _creationTime: v.number(),
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
            screenshot: v.optional(v.string()),
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
      }),
    ),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("sessionEvents")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId));

    if (args.level) {
      query = query.filter((q) => q.eq(q.field("level"), args.level));
    }

    return await query.order("desc").paginate(args.paginationOpts);
  },
});

/**
 * List recent events for a flow
 */
export const listRecentByFlow = query({
  args: {
    flowId: v.id("flows"),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("sessionEvents"),
      _creationTime: v.number(),
      sessionId: v.id("browserSessions"),
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
      timestamp: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    return await ctx.db
      .query("sessionEvents")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .order("desc")
      .take(limit);
  },
});
