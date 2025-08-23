import { httpRouter } from "convex/server";

const http = httpRouter();

// Note: Using Clerk authentication instead of custom auth routes
// Clerk handles authentication via middleware and JWT tokens

export default http;
