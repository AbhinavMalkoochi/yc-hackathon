import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";

/**
 * Create a new test run
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    prompt: v.string(),
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
  },
  returns: v.id("testRuns"),
  handler: async (ctx, args) => {
    const testRunId = await ctx.db.insert("testRuns", {
      name: args.name,
      description: args.description,
      prompt: args.prompt,
      status: "generating",
      totalFlows: 0,
      completedFlows: 0,
      failedFlows: 0,
      metadata: args.metadata,
    });
    return testRunId;
  },
});

/**
 * Get a test run by ID
 */
export const get = query({
  args: { testRunId: v.id("testRuns") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("testRuns"),
      _creationTime: v.number(),
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
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.testRunId);
  },
});

/**
 * List test runs with pagination and filtering
 */
export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(
      v.union(
        v.literal("generating"),
        v.literal("pending"),
        v.literal("running"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("cancelled"),
      ),
    ),
  },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("testRuns"),
        _creationTime: v.number(),
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
      }),
    ),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    let query = ctx.db.query("testRuns");

    if (args.status) {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status));
    } else {
      query = query.withIndex("by_creation_time");
    }

    return await query.order("desc").paginate(args.paginationOpts);
  },
});

/**
 * Update test run status
 */
export const updateStatus = mutation({
  args: {
    testRunId: v.id("testRuns"),
    status: v.union(
      v.literal("generating"),
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled"),
    ),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: Partial<Doc<"testRuns">> = {
      status: args.status,
    };

    if (args.startedAt !== undefined) {
      updates.startedAt = args.startedAt;
    }

    if (args.completedAt !== undefined) {
      updates.completedAt = args.completedAt;
    }

    await ctx.db.patch(args.testRunId, updates);
    return null;
  },
});

/**
 * Update flow counts for a test run
 */
export const updateFlowCounts = mutation({
  args: {
    testRunId: v.id("testRuns"),
    totalFlows: v.optional(v.number()),
    completedFlows: v.optional(v.number()),
    failedFlows: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: Partial<Doc<"testRuns">> = {};

    if (args.totalFlows !== undefined) {
      updates.totalFlows = args.totalFlows;
    }

    if (args.completedFlows !== undefined) {
      updates.completedFlows = args.completedFlows;
    }

    if (args.failedFlows !== undefined) {
      updates.failedFlows = args.failedFlows;
    }

    await ctx.db.patch(args.testRunId, updates);
    return null;
  },
});

/**
 * Update test run metadata
 */
export const updateMetadata = mutation({
  args: {
    testRunId: v.id("testRuns"),
    metadata: v.object({
      estimatedDurationMinutes: v.optional(v.number()),
      priority: v.optional(
        v.union(v.literal("low"), v.literal("normal"), v.literal("high")),
      ),
      tags: v.optional(v.array(v.string())),
      environment: v.optional(v.string()),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.testRunId, {
      metadata: args.metadata,
    });
    return null;
  },
});

/**
 * Delete a test run and all related data
 */
export const remove = mutation({
  args: { testRunId: v.id("testRuns") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // First, get all flows for this test run
    const flows = await ctx.db
      .query("flows")
      .withIndex("by_test_run", (q) => q.eq("testRunId", args.testRunId))
      .collect();

    // Delete all related browser sessions
    for (const flow of flows) {
      const sessions = await ctx.db
        .query("browserSessions")
        .withIndex("by_flow", (q) => q.eq("flowId", flow._id))
        .collect();

      for (const session of sessions) {
        // Delete session events
        const events = await ctx.db
          .query("sessionEvents")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .collect();

        for (const event of events) {
          await ctx.db.delete(event._id);
        }

        // Delete execution steps
        const steps = await ctx.db
          .query("executionSteps")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .collect();

        for (const step of steps) {
          await ctx.db.delete(step._id);
        }

        // Delete browser session
        await ctx.db.delete(session._id);
      }

      // Delete flow
      await ctx.db.delete(flow._id);
    }

    // Finally, delete the test run
    await ctx.db.delete(args.testRunId);
    return null;
  },
});

/**
 * Get test run statistics
 */
export const getStats = query({
  args: {},
  returns: v.object({
    total: v.number(),
    byStatus: v.object({
      generating: v.number(),
      pending: v.number(),
      running: v.number(),
      completed: v.number(),
      failed: v.number(),
      cancelled: v.number(),
    }),
    recent: v.array(
      v.object({
        _id: v.id("testRuns"),
        name: v.string(),
        status: v.union(
          v.literal("generating"),
          v.literal("pending"),
          v.literal("running"),
          v.literal("completed"),
          v.literal("failed"),
          v.literal("cancelled"),
        ),
        _creationTime: v.number(),
        totalFlows: v.number(),
        completedFlows: v.number(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    // Get all test runs for statistics
    const allTestRuns = await ctx.db.query("testRuns").collect();

    // Count by status
    const byStatus = {
      generating: 0,
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    for (const testRun of allTestRuns) {
      byStatus[testRun.status]++;
    }

    // Get recent test runs (last 10)
    const recent = await ctx.db
      .query("testRuns")
      .withIndex("by_creation_time")
      .order("desc")
      .take(10);

    return {
      total: allTestRuns.length,
      byStatus,
      recent: recent.map((tr) => ({
        _id: tr._id,
        name: tr.name,
        status: tr.status,
        _creationTime: tr._creationTime,
        totalFlows: tr.totalFlows,
        completedFlows: tr.completedFlows,
      })),
    };
  },
});

/**
 * Internal function to increment completed flows
 */
export const incrementCompletedFlows = internalMutation({
  args: { testRunId: v.id("testRuns") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const testRun = await ctx.db.get(args.testRunId);
    if (!testRun) {
      throw new Error("Test run not found");
    }

    await ctx.db.patch(args.testRunId, {
      completedFlows: testRun.completedFlows + 1,
    });
    return null;
  },
});

/**
 * Internal function to increment failed flows
 */
export const incrementFailedFlows = internalMutation({
  args: { testRunId: v.id("testRuns") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const testRun = await ctx.db.get(args.testRunId);
    if (!testRun) {
      throw new Error("Test run not found");
    }

    await ctx.db.patch(args.testRunId, {
      failedFlows: testRun.failedFlows + 1,
    });
    return null;
  },
});
