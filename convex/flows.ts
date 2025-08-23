import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";

/**
 * Create a new flow for a test run
 */
export const create = mutation({
  args: {
    testRunId: v.id("testRuns"),
    name: v.string(),
    description: v.string(),
    instructions: v.string(),
    order: v.number(),
    estimatedDurationMinutes: v.optional(v.number()),
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
  },
  returns: v.id("flows"),
  handler: async (ctx, args) => {
    const flowId = await ctx.db.insert("flows", {
      testRunId: args.testRunId,
      name: args.name,
      description: args.description,
      instructions: args.instructions,
      status: "pending",
      order: args.order,
      estimatedDurationMinutes: args.estimatedDurationMinutes,
      successCriteria: args.successCriteria,
      metadata: args.metadata,
    });

    // Update the test run's total flow count
    const testRun = await ctx.db.get(args.testRunId);
    if (testRun) {
      await ctx.db.patch(args.testRunId, {
        totalFlows: testRun.totalFlows + 1,
      });
    }

    return flowId;
  },
});

/**
 * Create multiple flows at once (batch creation)
 */
export const createBatch = mutation({
  args: {
    testRunId: v.id("testRuns"),
    flows: v.array(
      v.object({
        name: v.string(),
        description: v.string(),
        instructions: v.string(),
        estimatedDurationMinutes: v.optional(v.number()),
        successCriteria: v.optional(v.array(v.string())),
        metadata: v.optional(
          v.object({
            difficulty: v.optional(
              v.union(
                v.literal("easy"),
                v.literal("medium"),
                v.literal("hard"),
              ),
            ),
            category: v.optional(v.string()),
            targetUrl: v.optional(v.string()),
            expectedSteps: v.optional(v.number()),
          }),
        ),
      }),
    ),
  },
  returns: v.array(v.id("flows")),
  handler: async (ctx, args) => {
    const flowIds: Id<"flows">[] = [];

    for (let i = 0; i < args.flows.length; i++) {
      const flow = args.flows[i];
      const flowId = await ctx.db.insert("flows", {
        testRunId: args.testRunId,
        name: flow.name,
        description: flow.description,
        instructions: flow.instructions,
        status: "pending",
        order: i + 1,
        estimatedDurationMinutes: flow.estimatedDurationMinutes,
        successCriteria: flow.successCriteria,
        metadata: flow.metadata,
      });
      flowIds.push(flowId);
    }

    // Update the test run's total flow count
    const testRun = await ctx.db.get(args.testRunId);
    if (testRun) {
      await ctx.db.patch(args.testRunId, {
        totalFlows: testRun.totalFlows + args.flows.length,
      });
    }

    return flowIds;
  },
});

/**
 * Get a flow by ID
 */
export const get = query({
  args: { flowId: v.id("flows") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("flows"),
      _creationTime: v.number(),
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
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.flowId);
  },
});

/**
 * List flows for a test run
 */
export const listByTestRun = query({
  args: {
    testRunId: v.id("testRuns"),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("running"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("cancelled"),
      ),
    ),
  },
  returns: v.array(
    v.object({
      _id: v.id("flows"),
      _creationTime: v.number(),
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
    }),
  ),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("flows")
      .withIndex("by_test_run", (q) => q.eq("testRunId", args.testRunId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const flows = await query.collect();

    // Sort by order
    return flows.sort((a, b) => a.order - b.order);
  },
});

/**
 * List all flows with pagination
 */
export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
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
        _id: v.id("flows"),
        _creationTime: v.number(),
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
              v.union(
                v.literal("easy"),
                v.literal("medium"),
                v.literal("hard"),
              ),
            ),
            category: v.optional(v.string()),
            targetUrl: v.optional(v.string()),
            expectedSteps: v.optional(v.number()),
          }),
        ),
      }),
    ),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    let query = ctx.db.query("flows");

    if (args.status) {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status));
    } else {
      query = query.withIndex("by_test_run");
    }

    return await query.order("desc").paginate(args.paginationOpts);
  },
});

/**
 * Update flow status and timing
 */
export const updateStatus = mutation({
  args: {
    flowId: v.id("flows"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled"),
    ),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    actualDurationMs: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: Partial<Doc<"flows">> = {
      status: args.status,
    };

    if (args.startedAt !== undefined) {
      updates.startedAt = args.startedAt;
    }

    if (args.completedAt !== undefined) {
      updates.completedAt = args.completedAt;
    }

    if (args.actualDurationMs !== undefined) {
      updates.actualDurationMs = args.actualDurationMs;
    }

    await ctx.db.patch(args.flowId, updates);
    return null;
  },
});

/**
 * Update flow content (name, description, instructions)
 */
export const updateContent = mutation({
  args: {
    flowId: v.id("flows"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    instructions: v.optional(v.string()),
    successCriteria: v.optional(v.array(v.string())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: Partial<Doc<"flows">> = {};

    if (args.name !== undefined) {
      updates.name = args.name;
    }

    if (args.description !== undefined) {
      updates.description = args.description;
    }

    if (args.instructions !== undefined) {
      updates.instructions = args.instructions;
    }

    if (args.successCriteria !== undefined) {
      updates.successCriteria = args.successCriteria;
    }

    await ctx.db.patch(args.flowId, updates);
    return null;
  },
});

/**
 * Update flow metadata
 */
export const updateMetadata = mutation({
  args: {
    flowId: v.id("flows"),
    metadata: v.object({
      difficulty: v.optional(
        v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
      ),
      category: v.optional(v.string()),
      targetUrl: v.optional(v.string()),
      expectedSteps: v.optional(v.number()),
    }),
    estimatedDurationMinutes: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: Partial<Doc<"flows">> = {
      metadata: args.metadata,
    };

    if (args.estimatedDurationMinutes !== undefined) {
      updates.estimatedDurationMinutes = args.estimatedDurationMinutes;
    }

    await ctx.db.patch(args.flowId, updates);
    return null;
  },
});

/**
 * Approve flows (change status from pending to approved)
 */
export const approve = mutation({
  args: { flowIds: v.array(v.id("flows")) },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const flowId of args.flowIds) {
      await ctx.db.patch(flowId, { status: "approved" });
    }
    return null;
  },
});

/**
 * Delete a flow
 */
export const remove = mutation({
  args: { flowId: v.id("flows") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const flow = await ctx.db.get(args.flowId);
    if (!flow) {
      return null;
    }

    // Delete all related browser sessions
    const sessions = await ctx.db
      .query("browserSessions")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
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

    // Update test run's total flow count
    const testRun = await ctx.db.get(flow.testRunId);
    if (testRun) {
      await ctx.db.patch(flow.testRunId, {
        totalFlows: Math.max(0, testRun.totalFlows - 1),
      });
    }

    // Delete the flow
    await ctx.db.delete(args.flowId);
    return null;
  },
});

/**
 * Reorder flows within a test run
 */
export const reorder = mutation({
  args: {
    testRunId: v.id("testRuns"),
    flowOrders: v.array(
      v.object({
        flowId: v.id("flows"),
        order: v.number(),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const { flowId, order } of args.flowOrders) {
      // Verify the flow belongs to the test run
      const flow = await ctx.db.get(flowId);
      if (flow && flow.testRunId === args.testRunId) {
        await ctx.db.patch(flowId, { order });
      }
    }
    return null;
  },
});

/**
 * Get flow statistics for a test run
 */
export const getStatsByTestRun = query({
  args: { testRunId: v.id("testRuns") },
  returns: v.object({
    total: v.number(),
    byStatus: v.object({
      pending: v.number(),
      approved: v.number(),
      running: v.number(),
      completed: v.number(),
      failed: v.number(),
      cancelled: v.number(),
    }),
    totalEstimatedDurationMinutes: v.number(),
    totalActualDurationMs: v.number(),
  }),
  handler: async (ctx, args) => {
    const flows = await ctx.db
      .query("flows")
      .withIndex("by_test_run", (q) => q.eq("testRunId", args.testRunId))
      .collect();

    const byStatus = {
      pending: 0,
      approved: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    let totalEstimatedDurationMinutes = 0;
    let totalActualDurationMs = 0;

    for (const flow of flows) {
      byStatus[flow.status]++;

      if (flow.estimatedDurationMinutes) {
        totalEstimatedDurationMinutes += flow.estimatedDurationMinutes;
      }

      if (flow.actualDurationMs) {
        totalActualDurationMs += flow.actualDurationMs;
      }
    }

    return {
      total: flows.length,
      byStatus,
      totalEstimatedDurationMinutes,
      totalActualDurationMs,
    };
  },
});

/**
 * Internal function to mark flow as completed
 */
export const markCompleted = internalMutation({
  args: {
    flowId: v.id("flows"),
    actualDurationMs: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.flowId, {
      status: "completed",
      completedAt: now,
      actualDurationMs: args.actualDurationMs,
    });
    return null;
  },
});

/**
 * Internal function to mark flow as failed
 */
export const markFailed = internalMutation({
  args: {
    flowId: v.id("flows"),
    actualDurationMs: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const updates: Partial<Doc<"flows">> = {
      status: "failed",
      completedAt: now,
    };

    if (args.actualDurationMs !== undefined) {
      updates.actualDurationMs = args.actualDurationMs;
    }

    await ctx.db.patch(args.flowId, updates);
    return null;
  },
});
