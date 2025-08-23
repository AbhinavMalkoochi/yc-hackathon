# Next.js Frontend Documentation

## Overview

The Next.js frontend provides an interactive testing interface for the AI Browser Testing Agent, with direct Convex integration for real-time database operations and comprehensive testing pages for each development phase.

## Architecture Principles

- **Direct Database Integration**: Convex React hooks for real-time data operations
- **Component-Based Testing**: Dedicated test pages for each major feature
- **Real-time Updates**: Live data synchronization with Convex subscriptions
- **Progressive Development**: Each task has its own testing interface

## Project Structure

```
app/
├── page.tsx                    # Main landing page with task links
├── test/
│   └── page.tsx               # ✅ Task 1.1: API Integration test
├── streaming-test/
│   └── page.tsx               # ✅ Task 1.2: Streaming communication test
├── convex-test/
│   └── page.tsx               # ✅ Task 1.3: Convex database test
├── flow-generation-test/
│   └── page.tsx               # ✅ Task 2.1: LLM flow generation test
├── globals.css                # Global styles
└── layout.tsx                 # Root layout with Convex provider

lib/
└── api.ts                     # API client for FastAPI communication

components/
├── ConvexClientProvider.tsx   # Convex real-time database provider
└── FastApiTest.tsx           # Legacy FastAPI test component
```

## Core Features

### ✅ **Convex Database Integration (Task 1.3)**

- **Real-time Data**: Live updates using Convex React hooks (`useQuery`, `useMutation`)
- **Session Management**: Create and manage test sessions with persistent storage
- **Flow Management**: Create, edit, and approve test flows with real-time sync
- **System Statistics**: Live monitoring of sessions and browser instances
- **Error Handling**: Comprehensive error feedback with detailed logging

### ✅ **LLM Flow Generation (Task 2.1)**

- **Natural Language Input**: Describe testing requirements in plain English
- **Preset Prompts**: Quick-start buttons for common scenarios (e-commerce, login, etc.)
- **Real-time Generation**: Live flow generation with loading states and progress indicators
- **Structured Display**: Clear presentation of generated flows with names, descriptions, and instructions
- **Customizable Parameters**: Website URL and flow count configuration

### ✅ **Streaming Communication (Task 1.2)**

- **EventSource Client**: Real-time streaming using Server-Sent Events
- **Auto-reconnection**: Automatic reconnection on connection loss
- **Live Statistics**: Real-time system performance metrics
- **Connection Management**: Visual connection status and lifecycle management

### ✅ **API Integration Testing (Task 1.1)**

- **Interactive Testing**: Real-time testing interface for backend endpoints
- **Request/Response Logging**: Comprehensive logging with correlation IDs
- **Error Visualization**: Visual feedback for API errors and successes
- **Performance Metrics**: Request timing and response validation

## Test Pages

### Main Landing (`/`)

- **Development Links**: Quick access to all test interfaces
- **Task Progress**: Visual indication of completed vs in-progress tasks
- **System Overview**: High-level project status and next steps

### API Integration Test (`/test`)

- **Endpoint Testing**: Interactive testing of all FastAPI endpoints
- **Live Logging**: Real-time request/response logging with timestamps
- **Error Handling**: Visual feedback for API failures and network issues
- **Response Validation**: Schema validation and data verification

### Streaming Test (`/streaming-test`)

- **Real-time Streaming**: Live data streaming from FastAPI Server-Sent Events
- **Connection Status**: Visual indication of connection health
- **Auto-reconnection**: Automatic reconnection testing and verification
- **Performance Metrics**: Streaming performance and latency monitoring

### Convex Database Test (`/convex-test`)

- **Session Management**: Create and manage test sessions with custom prompts
- **Flow Operations**: Create sample flows and manage approval workflows
- **Real-time Sync**: Live database updates with immediate frontend reflection
- **System Statistics**: Live monitoring using Convex real-time queries
- **Direct Integration**: Uses Convex React hooks, not API calls

### LLM Flow Generation Test (`/flow-generation-test`)

- **AI-Powered Generation**: Generate test flows using OpenAI integration
- **Preset Scenarios**: Quick-start buttons for common testing scenarios
- **Custom Parameters**: Configurable website URL and flow count
- **Structured Output**: Clear presentation of generated flows with detailed instructions
- **Error Handling**: Robust error handling for LLM API failures

## Convex Integration

The frontend uses Convex directly through React hooks for all database operations:

```typescript
// Real-time data queries
const sessions = useQuery(api.browserTesting.listTestSessions, { limit: 10 });
const selectedSession = useQuery(api.browserTesting.getTestSession, {
  sessionId,
});

// Database mutations
const createSession = useMutation(api.browserTesting.createTestSession);
const createFlows = useMutation(api.browserTesting.createTestFlows);
```

**Benefits:**

- **Real-time Updates**: Automatic UI updates when data changes
- **Type Safety**: Full TypeScript support with generated types
- **Optimistic Updates**: Immediate UI feedback with automatic rollback on errors
- **Offline Support**: Built-in offline functionality and sync when reconnected

## Development Workflow

1. **Start Development**: Each new feature gets its own test page
2. **Interactive Testing**: Use dedicated test interfaces to verify functionality
3. **Real-time Feedback**: Live logging and error handling for immediate debugging
4. **Progressive Enhancement**: Build upon previous tasks with cumulative testing

## API Client

The `lib/api.ts` file provides a clean interface to FastAPI endpoints:

```typescript
// LLM Flow Generation
export async function generateFlows(
  prompt: string,
  websiteUrl?: string,
  numFlows?: number,
);

// Streaming Support
export function createStreamClient(url: string, options: StreamClientOptions);

// Basic API Operations
export async function apiRequest(endpoint: string, options?: RequestInit);
```

**Note**: Convex operations use React hooks directly, not the API client.

## Styling & UI

- **Tailwind CSS**: Utility-first CSS framework for rapid development
- **Responsive Design**: Mobile-friendly interfaces with grid layouts
- **Component Consistency**: Shared styling patterns across test pages
- **Visual Feedback**: Color-coded status indicators and loading states

## Next Implementation Steps

**Phase 2 Remaining**:

- Task 2.2: Enhanced flow editing interface with drag-and-drop
- Task 2.3: Flow approval workflow with batch operations

**Phase 3**: Browser Integration

- Task 3.1: Browser Use library integration and testing interface
- Task 3.2: Live browser session monitoring and control
- Task 3.3: Parallel session management with real-time status updates
