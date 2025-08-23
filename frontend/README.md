# Frontend - YC Agent AI Browser Testing Orchestrator

This is the Next.js 15 frontend for the AI Browser Testing Orchestrator, providing a modern, responsive interface for managing browser testing workflows.

## 🏗️ Architecture

### Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS 4 with CSS variables
- **Authentication**: Clerk integration
- **State Management**: Convex real-time subscriptions
- **Validation**: Zod for runtime type checking
- **Icons**: Lucide React
- **UI Components**: Custom components with Tailwind

### App Structure

```
app/
├── layout.tsx              # Root layout with providers
├── page.tsx               # Main dashboard page
└── globals.css            # Global styles and Tailwind

components/
├── AdminDashboard.tsx     # Database admin interface
├── DataTable.tsx          # Reusable table component
├── FastApiTest.tsx        # API connection testing
└── HealthDashboard.tsx    # Service health monitoring

lib/
├── api.ts                 # FastAPI client with error handling
└── utils.ts               # Utility functions

convex/
├── _generated/            # Auto-generated Convex types
└── ...                    # Convex functions (see backend docs)
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ with npm
- Access to Convex deployment
- FastAPI backend running on port 8000

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local

# Start development server
npm run dev:frontend
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000
```

## 🧩 Components

### Core Components

#### `HealthDashboard.tsx`

**Purpose**: Real-time monitoring of all external services

**Features**:

- Live service status indicators (OpenAI, Browser Use Cloud, Convex)
- Color-coded health status (green/yellow/red)
- Manual service testing buttons
- Detailed error messages and logs
- Auto-refresh every 30 seconds

**Props**: None (self-contained)

**Usage**:

```tsx
import HealthDashboard from "../components/HealthDashboard";

export default function Page() {
  return <HealthDashboard />;
}
```

#### `AdminDashboard.tsx`

**Purpose**: Complete database administration interface

**Features**:

- Tabbed interface (Overview, Test Runs, Flows)
- Real-time statistics and metrics
- CRUD operations for all database entities
- Sample data generation
- Data filtering and search
- Drill-down navigation between related entities

**Props**: None (self-contained)

**State Management**:

- Local state for UI interactions
- Convex subscriptions for real-time data
- FastAPI calls for admin operations

#### `DataTable.tsx`

**Purpose**: Reusable table component with advanced features

**Features**:

- Generic TypeScript support
- Sorting, filtering, search
- Bulk selection and actions
- Pagination support
- Loading and error states
- Responsive design
- Custom column rendering

**Props**:

```tsx
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  loading?: boolean;
  error?: string;
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onCreate?: () => void;
  searchable?: boolean;
  emptyMessage?: string;
  actions?: boolean;
}
```

**Usage**:

```tsx
import DataTable, { Column } from "./DataTable";

const columns: Column<TestRun>[] = [
  {
    key: "name",
    label: "Name",
    sortable: true,
    render: (value) => <strong>{value}</strong>,
  },
  // ... more columns
];

<DataTable
  data={testRuns}
  columns={columns}
  onView={handleView}
  onDelete={handleDelete}
/>;
```

#### `FastApiTest.tsx`

**Purpose**: Test connection to FastAPI backend

**Features**:

- Test basic API connectivity
- Health check validation
- Error handling demonstration
- Loading states
- Response time measurement

**Props**: None (self-contained)

### UI Patterns

#### Color Coding System

```tsx
// Status indicators
const statusColors = {
  healthy: "bg-green-100 text-green-800",
  unhealthy: "bg-red-100 text-red-800",
  degraded: "bg-yellow-100 text-yellow-800",
  unknown: "bg-gray-100 text-gray-800",
};

// Priority indicators
const priorityColors = {
  low: "text-gray-600",
  normal: "text-blue-600",
  high: "text-red-600",
};
```

#### Loading States

```tsx
// Component loading
{
  loading ? (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      <span className="ml-2">Loading...</span>
    </div>
  ) : (
    <ComponentContent />
  );
}

// Button loading
<button
  disabled={loading}
  className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 ..."
>
  {loading && <Spinner />}
  {loading ? "Processing..." : "Submit"}
</button>;
```

#### Error Handling

```tsx
// Error display
{
  error && (
    <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
      <strong>Error:</strong> {error}
    </div>
  );
}
```

## 🎨 Styling

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom color palette
      },
    },
  },
  plugins: [],
};
```

### Dark Mode Support

All components support dark mode through Tailwind's `dark:` prefixes:

```tsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  {/* Content */}
</div>
```

### Responsive Design

Components use responsive design patterns:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Responsive grid */}
</div>
```

## 🔌 API Integration

### FastAPI Client (`lib/api.ts`)

**Purpose**: Type-safe API client for FastAPI backend

**Features**:

- Automatic error handling
- Request/response validation with Zod
- Base URL configuration
- Timeout handling
- Type-safe responses

**Usage**:

```tsx
import { getMessage, checkHealth } from "../lib/api";

// In component
const handleGetMessage = async () => {
  try {
    const response = await getMessage();
    setMessage(response.message);
  } catch (error) {
    setError(error.message);
  }
};
```

**Available Functions**:

```tsx
// Health checks
export async function checkHealth(): Promise<HealthResponse>;
export async function checkOpenAIHealth(): Promise<HealthResponse>;
export async function checkConvexHealth(): Promise<HealthResponse>;

// Messages
export async function getMessage(): Promise<MessageResponse>;
```

### Convex Integration

**Real-time Data**:

```tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

// Query data
const testRuns = useQuery(api.testRuns.list, {
  paginationOpts: { numItems: 20, cursor: null },
});

// Mutate data
const createTestRun = useMutation(api.testRuns.create);

const handleCreate = async () => {
  await createTestRun({
    name: "New Test Run",
    prompt: "Test prompt",
  });
};
```

## 🧪 Development

### Development Commands

```bash
# Start development server
npm run dev:frontend

# Build for production
npm run build

# Run type checking
npx tsc --noEmit

# Run linting
npm run lint

# Run linting with fixes
npm run lint --fix
```

### Code Structure Guidelines

1. **Component Organization**:
   - One component per file
   - Clear prop interfaces
   - Proper TypeScript types
   - Meaningful component names

2. **State Management**:
   - Use Convex for data state
   - Use local state for UI interactions
   - Prefer derived state over useEffect

3. **Error Handling**:
   - Always handle async errors
   - Provide user-friendly error messages
   - Use loading states for better UX

4. **Performance**:
   - Use React.memo for expensive components
   - Implement proper key props for lists
   - Optimize re-renders with useMemo/useCallback when needed

### Adding New Components

1. **Create Component File**:

```tsx
// components/NewComponent.tsx
"use client";

import { useState } from "react";

interface NewComponentProps {
  // Define props
}

export default function NewComponent({ ...props }: NewComponentProps) {
  // Component logic
  return <div>{/* JSX */}</div>;
}
```

2. **Add to Main Page**:

```tsx
// app/page.tsx
import NewComponent from "../components/NewComponent";

export default function HomePage() {
  return (
    <main>
      <NewComponent />
    </main>
  );
}
```

3. **Update Types** (if needed):

```tsx
// lib/types.ts
export interface NewDataType {
  id: string;
  name: string;
  // ... other fields
}
```

## 🔧 Debugging

### Development Tools

1. **React Developer Tools**: Install browser extension for component inspection
2. **Convex Dashboard**: Monitor real-time data changes
3. **Network Tab**: Monitor API calls and responses
4. **Console Logs**: Strategic logging for debugging

### Common Issues

1. **Hydration Errors**:
   - Ensure server and client render the same content
   - Use `useEffect` for client-only code
   - Check for undefined data on initial render

2. **API Connection Issues**:
   - Verify FastAPI backend is running
   - Check CORS configuration
   - Validate environment variables

3. **Convex Issues**:
   - Ensure Convex deployment is active
   - Check authentication setup
   - Verify function exports

### Debugging Components

```tsx
// Add debug logging
useEffect(() => {
  console.log("Component state:", { data, loading, error });
}, [data, loading, error]);

// Conditional rendering for debugging
{
  process.env.NODE_ENV === "development" && (
    <div className="mt-4 p-4 bg-gray-100 rounded">
      <pre>{JSON.stringify(debugData, null, 2)}</pre>
    </div>
  );
}
```

## 📱 Responsive Design

### Breakpoint System

```tsx
// Tailwind breakpoints
sm: '640px'   // Small devices
md: '768px'   // Medium devices
lg: '1024px'  // Large devices
xl: '1280px'  // Extra large devices
2xl: '1536px' // 2X large devices

// Usage
<div className="w-full md:w-1/2 lg:w-1/3">
  {/* Responsive width */}
</div>
```

### Mobile-First Approach

All components are designed mobile-first:

```tsx
// Start with mobile styles, add larger screen styles
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="text-xl md:text-2xl lg:text-3xl">
    {/* Responsive typography */}
  </h1>
</div>
```

## 🚀 Deployment

### Build Process

```bash
# Create production build
npm run build

# Start production server (for testing)
npm start
```

### Environment Variables for Production

```bash
# Production environment variables
NEXT_PUBLIC_CONVEX_URL=https://your-prod-convex.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_FASTAPI_URL=https://your-prod-api.com
```

### Deployment Platforms

- **Vercel**: Automatic deployments with GitHub integration
- **Netlify**: Alternative deployment platform
- **Custom**: Any platform supporting Node.js

## 📊 Performance

### Optimization Strategies

1. **Code Splitting**: Automatic with Next.js App Router
2. **Image Optimization**: Use Next.js Image component
3. **Bundle Analysis**: `npm run build` shows bundle sizes
4. **Lazy Loading**: Use dynamic imports for heavy components

### Performance Monitoring

```tsx
// Measure component render times
useEffect(() => {
  const start = performance.now();
  return () => {
    const end = performance.now();
    console.log(`Component rendered in ${end - start}ms`);
  };
}, []);
```

## 🔒 Security

### Authentication Flow

1. **Clerk Integration**: Handles authentication automatically
2. **Protected Routes**: Use Clerk's authentication components
3. **API Security**: All API calls include authentication headers

### Best Practices

- Never expose sensitive data in client-side code
- Validate all user inputs
- Use HTTPS in production
- Implement proper error boundaries

---

**Last Updated**: 2025-01-25
**Frontend Version**: 2.0.0 (Post Vertical Slice 2)
