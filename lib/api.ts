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

const StatsResponseSchema = z.object({
  message: z.string(),
  status: z.string(),
  timestamp: z.string(),
  data: z.object({
    system_status: z.string(),
    active_streams: z.string(),
    uptime: z.string(),
    version: z.string(),
    task: z.string(),
  }),
});

type MessageResponse = z.infer<typeof MessageResponseSchema>;
type HealthResponse = z.infer<typeof HealthResponseSchema>;
type TestResponse = z.infer<typeof TestResponseSchema>;
type StatsResponse = z.infer<typeof StatsResponseSchema>;

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

    let data;
    try {
      data = await response.json();
      console.log(`[${requestId}] Response data:`, data);
    } catch (parseError) {
      console.error(`[${requestId}] JSON parse error:`, parseError);
      const textContent = await response.text();
      console.error(`[${requestId}] Raw response:`, textContent);
      throw new ApiError(
        `Failed to parse response as JSON: ${parseError}`,
        response.status,
        response,
      );
    }

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

export async function getStats(): Promise<StatsResponse> {
  return apiRequest("/api/stats", {}, StatsResponseSchema);
}

// Note: Convex operations are handled directly in Next.js components using Convex React hooks

// LLM Flow Generation API functions
export async function generateFlows(
  prompt: string,
  websiteUrl?: string,
  numFlows?: number,
) {
  return apiRequest("/api/generate-flows", {
    method: "POST",
    body: JSON.stringify({
      prompt,
      website_url: websiteUrl,
      num_flows: numFlows,
    }),
  });
}

// Browser Cloud API functions
export async function executeParallelFlows(flows: string[]) {
  return apiRequest("/api/browser-cloud/parallel-flows", {
    method: "POST",
    body: JSON.stringify({ flows }),
  });
}

export function createTaskStreamUrl(taskId: string) {
  return `${API_BASE_URL}/api/browser-cloud/task/${taskId}/stream`;
}

// Streaming client utilities
export interface StreamMessage {
  type: string;
  message?: string;
  timestamp?: string;
  [key: string]: any;
}

export interface StreamClientOptions {
  onMessage: (message: StreamMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
}

export function createStreamClient(
  endpoint: string,
  options: StreamClientOptions,
): () => void {
  const {
    onMessage,
    onConnect = () => {},
    onDisconnect = () => {},
    onError = () => {},
    autoReconnect = true,
    maxReconnectAttempts = 5,
    reconnectDelay = 1000,
  } = options;

  let eventSource: EventSource | null = null;
  let reconnectAttempts = 0;
  let shouldReconnect = true;

  function connect() {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      console.log(`Connecting to stream: ${url}`);

      eventSource = new EventSource(url);

      eventSource.onopen = () => {
        console.log(`Stream connected to ${url}`);
        reconnectAttempts = 0;
        onConnect();
      };

      eventSource.onmessage = (event) => {
        try {
          const message: StreamMessage = JSON.parse(event.data);
          console.log("Stream message received:", message);
          onMessage(message);
        } catch (error) {
          console.error("Error parsing stream message:", error);
          onError(new Event("parse_error"));
        }
      };

      eventSource.onerror = (event) => {
        console.error("Stream error:", event);
        onError(event);

        if (eventSource?.readyState === EventSource.CLOSED) {
          console.log("Stream connection closed");
          onDisconnect();

          if (autoReconnect && shouldReconnect) {
            attemptReconnect();
          }
        }
      };
    } catch (error) {
      console.error("Error creating EventSource:", error);
      onError(new Event("connection_error"));
    }
  }

  function attemptReconnect() {
    if (reconnectAttempts < maxReconnectAttempts && shouldReconnect) {
      reconnectAttempts++;
      console.log(
        `Attempting to reconnect... (${reconnectAttempts}/${maxReconnectAttempts})`,
      );
      setTimeout(() => {
        if (shouldReconnect) {
          connect();
        }
      }, reconnectDelay * reconnectAttempts);
    } else {
      console.error(
        "Max reconnection attempts reached or reconnection disabled",
      );
    }
  }

  function disconnect() {
    shouldReconnect = false;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
      console.log("Stream disconnected");
      onDisconnect();
    }
  }

  // Start the connection
  connect();

  // Return disconnect function
  return disconnect;
}

// Export types for use in components
export type {
  MessageResponse,
  HealthResponse,
  TestResponse,
  StatsResponse,
  ApiError,
};
