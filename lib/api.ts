import { z } from "zod";

// Base API configuration
const API_BASE_URL =
  process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";

// Response schemas for type safety
const MessageResponseSchema = z.object({
  message: z.string(),
  status: z.string(),
  timestamp: z.string(),
});

const HealthResponseSchema = z.object({
  status: z.string(),
  service: z.string(),
  timestamp: z.string().optional(),
  version: z.string().optional(),
});

const TestResponseSchema = z.object({
  message: z.string(),
  status: z.string(),
  timestamp: z.string(),
  correlation_id: z.string(),
  test_data: z.object({
    frontend_backend_connection: z.string(),
    logging_system: z.string(),
    timestamp_server: z.string(),
    request_method: z.string(),
    request_url: z.string(),
    user_agent: z.string(),
    task: z.string(),
  }),
});

type MessageResponse = z.infer<typeof MessageResponseSchema>;
type HealthResponse = z.infer<typeof HealthResponseSchema>;
type TestResponse = z.infer<typeof TestResponseSchema>;

// Generic API error class
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Generic API client function with enhanced logging
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  schema?: z.ZodSchema<T>,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log(`[${requestId}] Starting API request to: ${endpoint}`);
  console.log(`[${requestId}] Request options:`, {
    method: options.method || "GET",
    headers: options.headers,
  });

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
        ...options.headers,
      },
      ...options,
    });

    console.log(`[${requestId}] Response status: ${response.status}`);
    console.log(
      `[${requestId}] Response headers:`,
      Object.fromEntries(response.headers.entries()),
    );

    if (!response.ok) {
      console.error(
        `[${requestId}] Request failed: ${response.status} ${response.statusText}`,
      );
      throw new ApiError(
        `API request failed: ${response.status} ${response.statusText}`,
        response.status,
        response,
      );
    }

    const data = await response.json();
    console.log(`[${requestId}] Response data:`, data);

    // Validate response with Zod schema if provided
    if (schema) {
      const validatedData = schema.parse(data);
      console.log(`[${requestId}] Data validation successful`);
      return validatedData;
    }

    return data;
  } catch (error) {
    console.error(`[${requestId}] Request error:`, error);

    if (error instanceof ApiError) {
      throw error;
    }

    // Network or other errors
    throw new ApiError(
      `Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
      0,
    );
  }
}

// API functions
export async function getMessage(): Promise<MessageResponse> {
  return apiRequest("/api/message", {}, MessageResponseSchema);
}

export async function checkHealth(): Promise<HealthResponse> {
  return apiRequest("/health", {}, HealthResponseSchema);
}

export async function testEndpoint(): Promise<TestResponse> {
  return apiRequest("/api/test", {}, TestResponseSchema);
}

// Export types for use in components
export type { MessageResponse, HealthResponse, TestResponse, ApiError };
