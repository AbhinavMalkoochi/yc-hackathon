/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as browserSessions from "../browserSessions.js";
import type * as flows from "../flows.js";
import type * as myFunctions from "../myFunctions.js";
import type * as sessionEvents from "../sessionEvents.js";
import type * as testRuns from "../testRuns.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  browserSessions: typeof browserSessions;
  flows: typeof flows;
  myFunctions: typeof myFunctions;
  sessionEvents: typeof sessionEvents;
  testRuns: typeof testRuns;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
