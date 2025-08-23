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
});

type MessageResponse = z.infer<typeof MessageResponseSchema>;
type HealthResponse = z.infer<typeof HealthResponseSchema>;

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

// Generic API client function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  schema?: z.ZodSchema<T>,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new ApiError(
        `API request failed: ${response.status} ${response.statusText}`,
        response.status,
        response,
      );
    }

    const data = await response.json();

    // Validate response with Zod schema if provided
    if (schema) {
      return schema.parse(data);
    }

    return data;
  } catch (error) {
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

// Export types for use in components
export type { MessageResponse, HealthResponse, ApiError };

