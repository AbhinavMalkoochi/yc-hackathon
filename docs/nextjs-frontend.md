# Next.js Frontend Documentation

## Overview

The Next.js frontend provides an interactive testing interface for the AI Browser Testing Agent, with direct Convex integration for real-time database operations and comprehensive testing pages for each development phase. The frontend follows a modular component architecture for maintainability and reusability.

## 🏗️ Architecture

### Modular Component Structure

```
app/                       # Next.js app directory
├── page.tsx               # Main landing page with task links
├── test/                  # ✅ Task 1.1: API Integration test
├── streaming-test/        # ✅ Task 1.2: Streaming communication test
├── convex-test/           # ✅ Task 1.3: Convex database test
├── flow-generation-test/  # ✅ Task 2.1: LLM flow generation test
├── globals.css            # Global styles
└── layout.tsx             # Root layout with Convex provider

components/                 # Reusable React components
├── ui/                    # Base UI components
│   ├── Button.tsx         # Reusable button component with variants
│   ├── Card.tsx           # Content container component
│   └── Input.tsx          # Form input component with validation
├── features/               # Feature-specific components
│   ├── FlowGeneration.tsx # LLM flow generation interface
│   └── StreamingTest.tsx  # Streaming communication interface
├── layout/                 # Layout components
│   └── Header.tsx         # Navigation header with routing
└── ConvexClientProvider.tsx # Convex real-time database provider

convex/                    # Convex database and functions
├── schema.ts              # Database schema definition
├── browserTesting.ts      # Browser testing functions
├── userSessions.ts        # User session management
└── myFunctions.ts         # Additional utility functions

lib/                       # Utility libraries
└── api.ts                 # API client for FastAPI communication
```

### Architecture Principles

- **Direct Database Integration**: Convex React hooks for real-time data operations
- **Component-Based Testing**: Dedicated test pages for each major feature
- **Real-time Updates**: Live data synchronization with Convex subscriptions
- **Progressive Development**: Each task has its own testing interface
- **Modular Components**: Reusable UI components with consistent styling
- **Type Safety**: Full TypeScript support throughout the application

## 🎨 UI Components

### Base UI Components (`components/ui/`)

#### Button Component

- **Variants**: Primary, secondary, danger, success
- **Sizes**: Small, medium, large
- **Features**: Disabled states, loading states, consistent styling
- **Usage**: `<Button variant="primary" size="md">Click me</Button>`

#### Card Component

- **Features**: Optional title and subtitle
- **Styling**: Consistent shadows, borders, and spacing
- **Usage**: `<Card title="Section Title" subtitle="Description">Content</Card>`

#### Input Component

- **Types**: Text, email, password, number, URL
- **Features**: Labels, validation, error states, required indicators
- **Usage**: `<Input label="Email" type="email" required />`

### Feature Components (`components/features/`)

#### FlowGeneration Component

- **Purpose**: LLM-powered test flow generation interface
- **Features**:
  - Preset prompt buttons for common scenarios
  - Custom prompt input with validation
  - Website URL and flow count configuration
  - Generated flows display with structured output
- **Integration**: Uses FastAPI LLM service for flow generation

#### StreamingTest Component

- **Purpose**: Real-time streaming communication testing
- **Features**:
  - EventSource connection management
  - Connection status indicators
  - Real-time message display
  - Auto-reconnection testing
- **Integration**: Connects to FastAPI streaming endpoints

### Layout Components (`components/layout/`)

#### Header Component

- **Purpose**: Consistent navigation across all pages
- **Features**:
  - Logo and project branding
  - Navigation menu with all test pages
  - Responsive design for mobile devices
  - Active page highlighting

## 🚀 Core Features

### ✅ **Convex Database Integration (Task 1.3)**

- **Real-time Data**: Live updates using Convex React hooks (`useQuery`, `useMutation`)
- **Session Management**: Create and manage test sessions with persistent storage
- **Flow Management**: Create, edit, and approve test flows with real-time sync
- **System Statistics**: Live monitoring of sessions and browser instances
- **Error Handling**: Comprehensive error feedback with detailed logging

**Components**: Uses Convex React hooks directly in components

- `useQuery` for real-time data fetching
- `useMutation` for database operations
- Automatic UI updates when data changes

### ✅ **LLM Flow Generation (Task 2.1)**

- **Natural Language Input**: Describe testing requirements in plain English
- **Preset Prompts**: Quick-start buttons for common scenarios (e-commerce, login, etc.)
- **Real-time Generation**: Live flow generation with loading states and progress indicators
- **Structured Display**: Clear presentation of generated flows with names, descriptions, and instructions
- **Customizable Parameters**: Website URL and flow count configuration

**Component**: `components/features/FlowGeneration.tsx`

- Handles all LLM flow generation logic
- Manages form state and validation
- Displays generated flows in structured format

### ✅ **Streaming Communication (Task 1.2)**

- **EventSource Client**: Real-time streaming using Server-Sent Events
- **Auto-reconnection**: Automatic reconnection on connection loss
- **Live Statistics**: Real-time system performance metrics
- **Connection Management**: Visual connection status and lifecycle management

**Component**: `components/features/StreamingTest.tsx`

- Manages EventSource connections
- Displays real-time streaming data
- Provides connection status feedback

### ✅ **API Integration Testing (Task 1.1)**

- **Interactive Testing**: Real-time testing interface for backend endpoints
- **Request/Response Logging**: Comprehensive logging with correlation IDs
- **Error Visualization**: Visual feedback for API errors and successes
- **Performance Metrics**: Request timing and response validation

**Page**: `/test` - Dedicated API testing interface

## 📱 Test Pages

### Main Landing (`/`)

- **Development Links**: Quick access to all test interfaces
- **Task Progress**: Visual indication of completed vs in-progress tasks
- **System Overview**: High-level project status and next steps
- **Quick Actions**: Common testing and development tasks

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

- **AI-Powered Generation**: Generate test flows using Google Gemini integration
- **Preset Scenarios**: Quick-start buttons for common testing scenarios
- **Custom Parameters**: Configurable website URL and flow count
- **Structured Output**: Clear presentation of generated flows with detailed instructions
- **Error Handling**: Robust error handling for LLM API failures

## 🔌 Convex Integration

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

**Benefits**:

- **Real-time Updates**: Automatic UI updates when data changes
- **Type Safety**: Full TypeScript support with generated types
- **Optimistic Updates**: Immediate UI feedback with automatic rollback on errors
- **Offline Support**: Built-in offline functionality and sync when reconnected

## 🎨 Styling & UI

### Tailwind CSS

- **Utility-First**: Rapid development with utility classes
- **Responsive Design**: Mobile-friendly interfaces with grid layouts
- **Component Consistency**: Shared styling patterns across test pages
- **Visual Feedback**: Color-coded status indicators and loading states

### Design System

- **Color Palette**: Consistent color scheme for status, actions, and content
- **Typography**: Hierarchical text styles for headings, body, and captions
- **Spacing**: Consistent spacing scale using Tailwind's spacing utilities
- **Components**: Reusable UI components with consistent behavior

## 🔧 Development Workflow

1. **Start Development**: Each new feature gets its own test page
2. **Interactive Testing**: Use dedicated test interfaces to verify functionality
3. **Real-time Feedback**: Live logging and error handling for immediate debugging
4. **Progressive Enhancement**: Build upon previous tasks with cumulative testing
5. **Component Reuse**: Leverage existing UI components for consistency

## 📚 API Client

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

## 🚀 Next Implementation Steps

**Phase 2 Remaining**:

- Task 2.2: Enhanced flow editing interface with drag-and-drop
- Task 2.3: Flow approval workflow with batch operations

**Phase 3**: Browser Integration

- Task 3.1: Browser Use library integration and testing interface
- Task 3.2: Live browser session monitoring and control
- Task 3.3: Parallel session management with real-time status updates

## 📝 Component Development Guidelines

### Creating New Components

1. **Identify Component Type**: UI, feature, or layout component
2. **Use Existing Patterns**: Leverage existing component structure and styling
3. **TypeScript First**: Define proper interfaces and types
4. **Consistent Styling**: Use Tailwind utilities and existing design patterns

### Component Organization

- **UI Components**: Reusable, generic components in `components/ui/`
- **Feature Components**: Feature-specific logic in `components/features/`
- **Layout Components**: Page structure and navigation in `components/layout/`

### State Management

- **Local State**: Use `useState` for component-specific state
- **Form State**: Use controlled components with validation
- **Real-time Data**: Use Convex hooks for database operations
- **API State**: Use custom hooks for external API interactions
