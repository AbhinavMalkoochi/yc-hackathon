# Frontend - AI Browser Testing Agent

Next.js frontend for the AI Browser Testing Agent with real-time browser session monitoring.

## 🎯 Core Features

- **Prompt Interface**: Clean input form for natural language testing prompts
- **Flow Management**: Interactive editing and approval of generated testing flows  
- **Real-time Monitoring**: Live grid display of parallel browser sessions
- **WebSocket Integration**: Real-time updates without page refresh
- **Results Dashboard**: Comprehensive test execution results and analysis

## 🛠️ Technology Stack

- **Next.js 14+**: App Router with React Server Components
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Utility-first styling for responsive UI
- **WebSocket Client**: Real-time communication with FastAPI backend
- **Convex React**: Real-time database subscriptions

## 📁 Key Components

```
app/
├── page.tsx                    # Main testing interface
├── test/                      # Test pages for backend validation
├── api/                       # Next.js API routes (if needed)
├── flows/                     # Flow management interface
│   ├── generator/            # Prompt input and flow generation
│   ├── editor/              # Flow editing and approval
│   └── results/             # Execution results display
└── sessions/                 # Browser session monitoring
    ├── grid/               # Live session grid display
    ├── logs/              # Real-time logging component
    └── status/            # Session status indicators

components/
├── ConvexClientProvider.tsx   # Convex real-time database client
├── WebSocketProvider.tsx     # WebSocket connection management
├── FlowEditor.tsx            # Individual flow editing component
├── SessionMonitor.tsx        # Live browser session display
├── LogsPanel.tsx            # Real-time logs with filtering
└── TestInterface.tsx         # Backend function testing component
```

## 🔄 Real-time Features

### WebSocket Integration
- Live browser session status updates
- Real-time agent action streaming
- Browser console log display
- Connection resilience with auto-reconnect

### Convex Subscriptions
- Test run status changes
- Flow modifications sync across tabs
- Results persistence and history
- Collaborative editing support

## 🧪 Testing Strategy

Every backend function has a corresponding frontend test interface:

### Component Testing
- **FlowGenerator**: Test LLM integration with various prompts
- **SessionMonitor**: Validate real-time browser session streaming  
- **WebSocketClient**: Test connection resilience and message handling
- **ResultsPanel**: Verify execution data accuracy and display

### Integration Testing
- End-to-end flow: prompt → generation → execution → results
- Real-time updates during parallel browser execution
- Error handling and user feedback
- Performance with multiple concurrent sessions

## 🎨 UI/UX Principles

### Immediate Feedback
- All user actions provide instant visual feedback
- Loading states for all async operations
- Progress indicators for long-running tasks
- Real-time validation with helpful error messages

### Real-time Visibility
- Live browser session grid with current status
- Streaming logs with timestamps and filtering
- Progress bars showing execution completion
- Visual indicators for success/failure states

### Responsive Design
- Mobile-friendly interface for monitoring
- Adaptive layout for different screen sizes
- Accessible color schemes and typography
- Keyboard navigation support

## 🚀 Development Workflow

1. **Start with static components**: Build UI without backend integration
2. **Add API integration**: Connect to FastAPI endpoints with loading states
3. **Implement WebSocket**: Add real-time features incrementally
4. **Add Convex subscriptions**: Enable persistent data with real-time sync
5. **Optimize performance**: Ensure smooth operation with live data streams

## 📊 Performance Optimization

- **Component Memoization**: Prevent unnecessary re-renders during live updates
- **Virtual Scrolling**: Handle large log displays efficiently
- **Selective Updates**: Only update changed session data
- **Lazy Loading**: Load heavy components only when needed

## 🔧 Configuration

Environment variables needed:
```bash
# .env.local
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url
NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000
```

## 📋 Development Priorities

Based on tasks.md, frontend development follows this order:

1. **Basic API Integration** (Task 1.1)
   - Simple test page with FastAPI communication
   - Request/response logging and error handling

2. **WebSocket Implementation** (Task 1.2)  
   - Real-time message component
   - Connection status management

3. **Flow Management UI** (Tasks 2.1-2.3)
   - Prompt input form with validation
   - Flow editing interface with real-time sync
   - Approval workflow with status tracking

4. **Browser Session Monitoring** (Tasks 3.3-3.4)
   - Live session grid display
   - Real-time agent action streaming
   - Console log panel with filtering

5. **Results & Analysis** (Tasks 4.1-4.3)
   - Execution results dashboard
   - Performance metrics display
   - Historical data and re-execution

This frontend structure ensures every backend feature is immediately testable and provides comprehensive real-time monitoring for the browser testing automation system.
