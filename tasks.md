# AI Browser Testing Agent - Simplified MVP Tasks

## Project Overview

**Simplified MVP Goal**: Users input natural language prompts → Generate website testing flows → Users accept/edit flows → Create parallel browser sessions to test flows on websites

**Core Stack**:

- Frontend: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- Backend: FastAPI (Python), WebSocket for real-time streaming
- Database: Convex (real-time database)
- Browser Automation: Browser Use Python library (parallel browser sessions)
- Real-time Communication: WebSocket connections for live streaming

**What's REMOVED for MVP**:

- Authentication/Clerk
- File upload system
- Notification systems
- Data export functionality
- Web scraping features
- Playwright (replaced with Browser Use)
- Over-engineered features

## Task Structure

Each task is designed to be:

1. **Small & Testable**: Can be completed and tested independently
2. **Frontend Testable**: Every backend function has a corresponding frontend test interface
3. **Incremental**: Builds upon previous tasks for continuous validation
4. **MVP-Focused**: Only includes essential functionality

---

## Phase 1: Foundation & Real-time Infrastructure (2-3 days)

### Task 1.1: Basic FastAPI-Next.js Integration Test

**Priority**: Critical  
**Estimated Time**: 1-2 hours  
**Dependencies**: None

**Description**: Establish basic communication between FastAPI and Next.js with comprehensive logging.

**Implementation**:

- Create simple FastAPI endpoint (`/api/test`) that returns JSON response
- Create Next.js test page (`/test`) with button to call FastAPI endpoint
- Add comprehensive logging on both frontend and backend
- Display API response and logs in real-time on frontend

**Acceptance Criteria**:

- [ ] FastAPI endpoint responds with test data
- [ ] Next.js can successfully call FastAPI endpoint
- [ ] Frontend displays API response with timestamps
- [ ] Console logs show request/response flow
- [ ] Error handling displays meaningful messages

**Testing**:

- Click test button, verify response appears immediately
- Check browser console for detailed logs
- Test with FastAPI server down (error handling)

---

### Task 1.2: Streaming Response Real-time Communication Setup

**Priority**: Critical  
**Estimated Time**: 1-2 hours  
**Dependencies**: Task 1.1

**Description**: Establish streaming response from FastAPI to Next.js for real-time updates (unidirectional communication).

**Implementation**:

- Add streaming endpoint in FastAPI (`/api/stream`)
- Use FastAPI StreamingResponse for real-time data streaming
- Create Next.js EventSource client for consuming streams
- Implement connection status indicator
- Add real-time data display with timestamps
- Handle connection failures and auto-reconnection

**Acceptance Criteria**:

- [ ] Streaming endpoint sends real-time data to frontend
- [ ] Frontend receives and displays streamed data immediately
- [ ] Connection status indicator shows current state
- [ ] Automatic reconnection on connection loss
- [ ] Stream data persists during session

**Testing**:

- Connect to stream endpoint and verify real-time updates
- Verify updates appear without page refresh
- Test reconnection by stopping/starting FastAPI server
- Check data ordering and timestamps

---

### Task 1.3: Convex Database Integration & Real-time Sync

**Priority**: High  
**Estimated Time**: 2-3 hours  
**Dependencies**: Task 1.2

**Description**: Integrate Convex database for storing test runs and flows with real-time frontend updates.

**Implementation**:

- Setup Convex schema for test runs and flows
- Create Convex mutations and queries for CRUD operations
- Use Convex React hooks directly in Next.js frontend
- Remove Convex integration from FastAPI backend (keep backend functional)
- Display real-time database updates using Convex subscriptions

**Acceptance Criteria**:

- [x] Test runs stored and retrieved from Convex ✅
- [x] Real-time updates when data changes ✅
- [x] Frontend automatically refreshes on data changes ✅
- [x] CRUD operations work directly through Convex React hooks ✅
- [x] Error handling for database operations ✅

**Testing**:

- Create test sessions through Convex hooks, verify real-time updates ✅
- Create and manage test flows with approval workflow ✅
- Test multiple clients, confirm all see live updates ✅
- Verify error handling and comprehensive logging ✅
- Use `/convex-test` page for interactive testing ✅

---

## Phase 2: Flow Generation & Management (2-3 days)

### Task 2.1: LLM Integration for Flow Generation

**Priority**: High  
**Estimated Time**: 3-4 hours  
**Dependencies**: Task 1.3

**Description**: Integrate LLM API to generate testing flows from natural language prompts.

**Implementation**:

- Add LLM service integration (OpenAI/Anthropic)
- Create FastAPI endpoint for flow generation (`/api/generate-flows`)
- Implement prompt engineering for testing flow generation
- Add frontend form for prompt input
- Display generated flows with loading states

**Acceptance Criteria**:

- [ ] LLM generates 3-5 testing flows from prompt
- [ ] Generated flows have descriptive names and instructions
- [ ] Frontend shows loading state during generation
- [ ] Generated flows displayed in editable format
- [ ] Error handling for LLM API failures

**Testing**:

- Enter various test prompts, verify sensible flows generated
- Test with invalid prompts, confirm error handling
- Check generated flow quality and format
- Test LLM API timeout scenarios

---

### Task 2.2: Flow Editing & Management Interface

**Priority**: High  
**Estimated Time**: 2-3 hours  
**Dependencies**: Task 2.1

**Description**: Create frontend interface for users to edit, delete, and manage generated flows.

**Implementation**:

- Create flow editor component with text areas
- Add flow management buttons (edit, delete, add new)
- Implement flow validation (check completeness)
- Add flow reordering functionality
- Save flow changes to Convex in real-time

**Acceptance Criteria**:

- [x] Users can edit flow names and instructions ✅
- [x] Add/delete flows with immediate UI update ✅
- [x] Flow validation shows warnings for incomplete flows ✅
- [x] Drag-and-drop flow reordering ✅
- [ ] Changes saved automatically to database (Future enhancement)

**Testing**:

- [x] Edit flow text, verify changes persist ✅
- [x] Delete flows, confirm removal from database ✅
- [x] Add new custom flows manually ✅
- [x] Test flow validation with incomplete data ✅

---

### Task 2.3: Flow Approval & Execution Preparation

**Priority**: Medium  
**Estimated Time**: 1-2 hours  
**Dependencies**: Task 2.2

**Description**: Add flow approval system and prepare for execution.

**Implementation**:

- Add approval checkboxes for each flow
- Create "Start Testing" button (enabled when flows approved)
- Implement execution preparation phase
- Add estimated execution time display
- Create execution status tracking

**Acceptance Criteria**:

- [x] Users can approve/disapprove individual flows ✅
- [x] Start button only enabled when at least one flow approved ✅
- [x] Execution preparation shows progress indicator ✅
- [x] Estimated execution times displayed ✅
- [x] Flow status tracking (pending, approved, executing, completed) ✅

**Testing**:

- [x] Approve various flows, verify button state changes ✅
- [x] Start execution preparation, check status updates ✅
- [x] Test with no flows approved ✅

---

## Phase 3: Browser Use Cloud Integration & Parallel Sessions (2-3 days)

### Task 3.1: Browser Use Cloud API Setup & Single Task Test

**Priority**: Critical  
**Estimated Time**: 2-3 hours  
**Dependencies**: Task 2.3

**Description**: Set up Browser Use Cloud API using official SDK and test single task execution with live browser viewing.

**Implementation**:

```python
# Install Browser Use SDK
pip install browser-use-sdk

# FastAPI Backend Setup
from browser_use_sdk import BrowserUse

client = BrowserUse(
    api_key=os.getenv("BROWSER_USE_API_KEY"),
)

@app.post("/api/browser-cloud/create-task")
async def create_browser_task(task_request: dict):
    """Create single browser task using Browser Use Cloud API"""
    try:
        # Create task using official SDK
        task = client.tasks.create(
            task=task_request["task"],
            agent_settings={
                "llm": "gpt-4o",  # or other supported LLMs
                "start_url": task_request.get("start_url")
            }
        )

        # Get session details with live URL
        session = client.sessions.retrieve(task.session_id)

        return {
            "task_id": task.id,
            "session_id": task.session_id,
            "live_url": session.live_url,  # Key: Live browser viewing URL
            "status": "started"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/browser-cloud/task/{task_id}")
async def get_task_status(task_id: str):
    """Get task status and details"""
    task = client.tasks.retrieve(task_id)
    return {
        "task_id": task.id,
        "status": task.status,
        "live_url": task.session.live_url,
        "steps": task.steps,
        "is_success": task.is_success,
        "done_output": task.done_output
    }
```

**Frontend Integration**:

```typescript
// Next.js Frontend
const createBrowserTask = async (taskDescription: string) => {
  const response = await fetch("/api/browser-cloud/create-task", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      task: taskDescription,
      start_url: "https://example.com",
    }),
  });

  const result = await response.json();

  // Display live browser session
  setLiveUrl(result.live_url);
  setTaskId(result.task_id);

  // Start polling for status updates
  pollTaskStatus(result.task_id);
};
```

**Acceptance Criteria**:

- [ ] Browser Use Cloud API key configured and authenticated
- [ ] Browser Use SDK successfully installed (`pip install browser-use-sdk`)
- [ ] Single task created using `client.tasks.create()`
- [ ] Live browser URL (`session.live_url`) returned and displayed
- [ ] Task status polling works via `client.tasks.retrieve()`
- [ ] Frontend displays live browser session in iframe
- [ ] Proper error handling for 402 (insufficient credits) and 404 errors

**Testing**:

- Create single browser task with simple navigation instruction
- Verify live URL opens and shows actual browser session
- Poll task status and verify status changes (started → finished)
- Test error handling for invalid API key or insufficient credits
- Confirm task results and output are captured

---

### Task 3.2: Flow-to-Task Mapping & Agent Profile Configuration

**Priority**: Critical  
**Estimated Time**: 3-4 hours  
**Dependencies**: Task 3.1

**Description**: Map testing flows to Browser Use Cloud tasks with proper agent profiles and structured outputs.

**Implementation**:

```python
# Backend: Flow execution service
@app.post("/api/browser-cloud/execute-flow")
async def execute_single_flow(flow: dict):
    """Execute a single testing flow using Browser Use Cloud"""
    try:
        # Create or use existing agent profile
        agent_profiles = client.agent_profiles.list()
        if not agent_profiles.items:
            # Create default agent profile for web testing
            agent_profile = client.agent_profiles.create(
                name="Web Testing Agent",
                description="AI agent for automated web testing",
                max_agent_steps=50,
                vision=True,
                thinking=True,
                custom_system_prompt_extension="""
You are a web testing agent. Follow the testing instructions precisely.
For each step, describe what you're doing and what you observe.
Report any errors, unexpected behavior, or issues you encounter.
"""
            )
            profile_id = agent_profile.id
        else:
            profile_id = agent_profiles.items[0].id

        # Create browser profile if needed (optional)
        browser_profiles = client.browser_profiles.list()
        browser_profile_id = browser_profiles.items[0].id if browser_profiles.items else None

        # Convert flow to Browser Use Cloud task
        task_description = f"""
Test Website: {flow.get('target_url', 'https://example.com')}

Testing Instructions:
{flow['instructions']}

Expected Result:
{flow.get('expected_result', 'Complete the testing steps successfully')}

Please execute each step carefully and report your findings.
"""

        # Define structured output schema
        structured_output = {
            "type": "object",
            "properties": {
                "test_passed": {"type": "boolean"},
                "steps_completed": {"type": "array", "items": {"type": "string"}},
                "issues_found": {"type": "array", "items": {"type": "string"}},
                "final_status": {"type": "string"},
                "execution_time": {"type": "number"},
                "screenshots_taken": {"type": "number"}
            },
            "required": ["test_passed", "steps_completed", "final_status"]
        }

        # Create task with agent profile
        task = client.tasks.create(
            task=task_description,
            agent_settings={
                "llm": "gpt-4o",  # Use latest model for best performance
                "start_url": flow.get('target_url', 'https://example.com'),
                "profile_id": profile_id
            },
            browser_settings={
                "profile_id": browser_profile_id
            } if browser_profile_id else None,
            structured_output_json=json.dumps(structured_output),
            metadata={
                "flow_id": flow.get('id'),
                "flow_name": flow.get('name'),
                "execution_timestamp": datetime.utcnow().isoformat()
            }
        )

        # Get session with live URL
        session = client.sessions.retrieve(task.session_id)

        return {
            "task_id": task.id,
            "session_id": task.session_id,
            "live_url": session.live_url,
            "flow_id": flow.get('id'),
            "status": "started",
            "agent_profile_id": profile_id
        }

    except Exception as e:
        logger.error(f"Failed to execute flow: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Flow execution failed: {str(e)}")

@app.get("/api/browser-cloud/flow-result/{task_id}")
async def get_flow_result(task_id: str):
    """Get detailed flow execution results"""
    task = client.tasks.retrieve(task_id)

    # Parse structured output if available
    structured_result = None
    if task.done_output:
        try:
            structured_result = json.loads(task.done_output)
        except:
            structured_result = {"raw_output": task.done_output}

    return {
        "task_id": task.id,
        "status": task.status,
        "is_success": task.is_success,
        "live_url": task.session.live_url,
        "steps": [
            {
                "number": step.number,
                "goal": step.next_goal,
                "evaluation": step.evaluation_previous_goal,
                "url": step.url,
                "screenshot_url": step.screenshot_url,
                "actions": step.actions
            } for step in task.steps
        ],
        "structured_result": structured_result,
        "metadata": task.metadata,
        "started_at": task.started_at,
        "finished_at": task.finished_at
    }
```

**Frontend Integration**:

```typescript
// Flow execution with live viewing
const executeFlow = async (flow: Flow) => {
  setExecutionStatus("starting");

  try {
    const response = await fetch("/api/browser-cloud/execute-flow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(flow),
    });

    const result = await response.json();

    // Display live browser session
    setExecutionData((prev) => ({
      ...prev,
      [flow.id]: {
        taskId: result.task_id,
        liveUrl: result.live_url,
        status: "running",
      },
    }));

    // Start polling for results
    pollFlowExecution(result.task_id, flow.id);
  } catch (error) {
    console.error("Flow execution failed:", error);
    setExecutionStatus("failed");
  }
};
```

**Acceptance Criteria**:

- [ ] Flows converted to Browser Use Cloud task descriptions
- [ ] Agent profiles created for web testing optimization
- [ ] Structured output schema defined for consistent results
- [ ] Task metadata includes flow tracking information
- [ ] Live browser URLs available for each executing flow
- [ ] Detailed step-by-step execution results captured
- [ ] Error handling for task creation and execution failures

**Testing**:

- Execute single flow and verify agent follows instructions
- Check structured output parsing and result format
- Verify live URL shows actual browser automation
- Test different flow types (navigation, form filling, clicking)
- Confirm agent profile optimization improves performance
- Test error scenarios and recovery mechanisms

---

### Task 3.3: Parallel Flow Execution & Session Orchestration

**Priority**: High  
**Estimated Time**: 3-4 hours  
**Dependencies**: Task 3.2

**Description**: Execute multiple flows concurrently using Browser Use Cloud sessions with live monitoring and isolation.

**Implementation**:

```python
# Backend: Parallel execution orchestrator
@app.post("/api/browser-cloud/execute-flows-parallel")
async def execute_flows_parallel(flows: List[dict]):
    """Execute multiple flows concurrently using Browser Use Cloud"""
    if len(flows) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 concurrent flows allowed")

    execution_results = []

    try:
        # Create tasks concurrently (but not sessions to avoid rate limits)
        for i, flow in enumerate(flows):
            # Add small delay between task creations to avoid rate limiting
            if i > 0:
                await asyncio.sleep(0.5)

            # Each flow gets its own session automatically
            task = client.tasks.create(
                task=f"""
Test Website: {flow.get('target_url', 'https://example.com')}

Flow #{i+1}: {flow.get('name', f'Flow {i+1}')}

Testing Instructions:
{flow['instructions']}

Expected Result: {flow.get('expected_result', 'Complete testing successfully')}

Execute each step carefully and report your findings.
""",
                agent_settings={
                    "llm": "gpt-4o",
                    "start_url": flow.get('target_url', 'https://example.com'),
                    "profile_id": await get_or_create_agent_profile()
                },
                structured_output_json=json.dumps({
                    "type": "object",
                    "properties": {
                        "test_passed": {"type": "boolean"},
                        "steps_completed": {"type": "array", "items": {"type": "string"}},
                        "issues_found": {"type": "array", "items": {"type": "string"}},
                        "final_status": {"type": "string"}
                    },
                    "required": ["test_passed", "final_status"]
                }),
                metadata={
                    "flow_id": flow.get('id'),
                    "flow_name": flow.get('name'),
                    "batch_execution": True,
                    "execution_group": f"batch_{int(datetime.utcnow().timestamp())}"
                }
            )

            # Get session details
            session = client.sessions.retrieve(task.session_id)

            execution_results.append({
                "flow_id": flow.get('id'),
                "flow_name": flow.get('name'),
                "task_id": task.id,
                "session_id": task.session_id,
                "live_url": session.live_url,
                "status": "started",
                "start_time": datetime.utcnow().isoformat()
            })

        return {
            "batch_id": f"batch_{int(datetime.utcnow().timestamp())}",
            "total_flows": len(flows),
            "executions": execution_results,
            "status": "started"
        }

    except Exception as e:
        logger.error(f"Parallel execution failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Parallel execution failed: {str(e)}")

@app.get("/api/browser-cloud/batch-status/{batch_id}")
async def get_batch_status(batch_id: str):
    """Get status of all flows in a batch execution"""
    # Get all tasks with matching batch metadata
    sessions = client.sessions.list(page_size=50)
    batch_sessions = []

    for session in sessions.items:
        # Get tasks for this session
        session_details = client.sessions.retrieve(session.id)
        if session_details.tasks:
            for task in session_details.tasks:
                if (task.metadata.get('execution_group') == batch_id or
                    task.metadata.get('batch_execution')):
                    batch_sessions.append({
                        "flow_id": task.metadata.get('flow_id'),
                        "flow_name": task.metadata.get('flow_name'),
                        "task_id": task.id,
                        "session_id": session.id,
                        "live_url": session.live_url,
                        "status": task.status,
                        "is_success": task.is_success,
                        "started_at": task.started_at,
                        "finished_at": task.finished_at
                    })

    # Calculate overall batch status
    total_tasks = len(batch_sessions)
    completed_tasks = len([t for t in batch_sessions if t['status'] in ['finished', 'stopped']])
    failed_tasks = len([t for t in batch_sessions if t['status'] == 'stopped' and not t['is_success']])

    overall_status = "running"
    if completed_tasks == total_tasks:
        overall_status = "completed"
    elif failed_tasks > 0 and completed_tasks == total_tasks:
        overall_status = "completed_with_failures"

    return {
        "batch_id": batch_id,
        "overall_status": overall_status,
        "total_flows": total_tasks,
        "completed": completed_tasks,
        "failed": failed_tasks,
        "running": total_tasks - completed_tasks,
        "executions": batch_sessions
    }

async def get_or_create_agent_profile():
    """Get existing or create new agent profile for web testing"""
    profiles = client.agent_profiles.list()

    # Look for existing web testing profile
    for profile in profiles.items:
        if "testing" in profile.name.lower():
            return profile.id

    # Create new profile if none exists
    profile = client.agent_profiles.create(
        name="Web Testing Agent",
        description="Optimized for automated web testing",
        max_agent_steps=50,
        vision=True,
        thinking=True,
        custom_system_prompt_extension="""
You are a professional web testing agent. Execute testing steps methodically:
1. Navigate carefully to required pages
2. Wait for elements to load before interacting
3. Verify each action was successful
4. Report any errors or unexpected behavior clearly
5. Take screenshots of important steps
"""
    )
    return profile.id
```

**Frontend Integration**:

```typescript
// Parallel execution with live monitoring
const executeFlowsParallel = async (approvedFlows: Flow[]) => {
  setParallelExecution({ status: 'starting', flows: [] });

  try {
    const response = await fetch('/api/browser-cloud/execute-flows-parallel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(approvedFlows)
    });

    const batchResult = await response.json();

    // Set up live monitoring for all flows
    setParallelExecution({
      batchId: batchResult.batch_id,
      status: 'running',
      flows: batchResult.executions.map(exec => ({
        ...exec,
        liveUrl: exec.live_url
      }))
    });

    // Start polling batch status
    pollBatchStatus(batchResult.batch_id);

  } catch (error) {
    console.error('Parallel execution failed:', error);
    setParallelExecution({ status: 'failed', flows: [] });
  }
};

const LiveSessionGrid = ({ flows }: { flows: any[] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {flows.map((flow, index) => (
        <div key={flow.task_id} className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">{flow.flow_name}</h3>
          <div className="mb-2">
            <span className={`px-2 py-1 rounded text-xs ${
              flow.status === 'finished' ? 'bg-green-100 text-green-800' :
              flow.status === 'running' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {flow.status}
            </span>
          </div>
          {flow.liveUrl && (
            <iframe
              src={flow.liveUrl}
              className="w-full h-48 border rounded"
              title={`Live session for ${flow.flow_name}`}
            />
          )}
        </div>
      ))}
    </div>
  );
};
```

**Acceptance Criteria**:

- [ ] Execute up to 5 flows concurrently without rate limiting
- [ ] Each flow runs in isolated Browser Use Cloud session
- [ ] Independent live URLs provided for each concurrent session
- [ ] Batch status tracking for overall execution progress
- [ ] Session failures isolated (don't affect other sessions)
- [ ] Resource management with API rate limit handling
- [ ] Live session grid displays all concurrent browsers

**Testing**:

- Execute 3-5 flows simultaneously and verify isolation
- Check live URLs work independently for each session
- Verify batch status tracking and completion detection
- Test failure scenarios (one session fails, others continue)
- Monitor API usage and confirm no rate limiting issues
- Test frontend grid display with multiple live sessions

---

### Task 3.4: Live Browser Session Display & Real-time Status Updates

**Priority**: High  
**Estimated Time**: 2-3 hours  
**Dependencies**: Task 3.3

**Description**: Create responsive live browser session display with real-time status updates using Browser Use Cloud live URLs.

**Implementation**:

```typescript
// Frontend: Live session monitoring component
interface LiveSessionData {
  taskId: string;
  sessionId: string;
  flowName: string;
  liveUrl: string;
  status: 'started' | 'paused' | 'finished' | 'stopped';
  isSuccess?: boolean;
  currentStep?: number;
  totalSteps?: number;
  startedAt: string;
  finishedAt?: string;
}

const LiveSessionMonitor = ({ batchId }: { batchId: string }) => {
  const [sessions, setSessions] = useState<LiveSessionData[]>([]);
  const [batchStatus, setBatchStatus] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Poll batch status every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        setRefreshing(true);
        const response = await fetch(`/api/browser-cloud/batch-status/${batchId}`);
        const status = await response.json();

        setBatchStatus(status);
        setSessions(status.executions);

        // Stop polling if all sessions completed
        if (status.overall_status === 'completed' ||
            status.overall_status === 'completed_with_failures') {
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Failed to fetch batch status:', error);
      } finally {
        setRefreshing(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [batchId]);

  return (
    <div className="space-y-6">
      {/* Batch Overview */}
      {batchStatus && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Execution Progress</h2>
            {refreshing && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{batchStatus.total_flows}</div>
              <div className="text-sm text-gray-600">Total Flows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{batchStatus.running}</div>
              <div className="text-sm text-gray-600">Running</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{batchStatus.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{batchStatus.failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(batchStatus.completed / batchStatus.total_flows) * 100}%`
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Live Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((session) => (
          <LiveSessionCard key={session.taskId} session={session} />
        ))}
      </div>
    </div>
  );
};

const LiveSessionCard = ({ session }: { session: LiveSessionData }) => {
  const [expanded, setExpanded] = useState(false);
  const [details, setDetails] = useState<any>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finished': return 'bg-green-100 text-green-800';
      case 'started': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'stopped': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const loadDetails = async () => {
    try {
      const response = await fetch(`/api/browser-cloud/flow-result/${session.taskId}`);
      const data = await response.json();
      setDetails(data);
    } catch (error) {
      console.error('Failed to load session details:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Session Header */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg truncate">{session.flowName}</h3>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(session.status)}`}>
            {session.status}
          </span>
        </div>

        <div className="text-sm text-gray-600">
          Started: {new Date(session.startedAt).toLocaleTimeString()}
          {session.finishedAt && (
            <div>Finished: {new Date(session.finishedAt).toLocaleTimeString()}</div>
          )}
        </div>

        {session.isSuccess !== undefined && (
          <div className={`mt-2 text-sm font-medium ${
            session.isSuccess ? 'text-green-600' : 'text-red-600'
          }`}>
            {session.isSuccess ? '✅ Success' : '❌ Failed'}
          </div>
        )}
      </div>

      {/* Live Browser View */}
      {session.liveUrl && (
        <div className="relative">
          <iframe
            src={session.liveUrl}
            className="w-full h-64 border-0"
            title={`Live browser for ${session.flowName}`}
            allow="fullscreen"
          />
          <div className="absolute top-2 right-2">
            <a
              href={session.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs hover:bg-opacity-70"
            >
              Open Full
            </a>
          </div>
        </div>
      )}

      {/* Session Actions */}
      <div className="p-4 bg-gray-50">
        <div className="flex justify-between items-center">
          <button
            onClick={() => {
              setExpanded(!expanded);
              if (!expanded && !details) loadDetails();
            }}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {expanded ? 'Hide Details' : 'Show Details'}
          </button>

          <div className="flex space-x-2">
            <button className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">
              Logs
            </button>
            <button className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700">
              Download
            </button>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && details && (
          <div className="mt-4 pt-4 border-t">
            <div className="space-y-2 text-sm">
              <div><strong>Steps Completed:</strong> {details.steps?.length || 0}</div>
              {details.structured_result && (
                <div>
                  <strong>Test Result:</strong>
                  <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(details.structured_result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

**Backend Support**:

```python
# Additional endpoints for session management
@app.get("/api/browser-cloud/session-logs/{task_id}")
async def get_session_logs(task_id: str):
    """Get downloadable logs for a task"""
    try:
        logs_response = client.tasks.get_logs(task_id)
        return {"download_url": logs_response.download_url}
    except Exception as e:
        raise HTTPException(status_code=404, detail="Logs not found")

@app.post("/api/browser-cloud/create-share/{session_id}")
async def create_session_share(session_id: str):
    """Create public share for session"""
    try:
        share = client.sessions.public_share.create(session_id)
        return {
            "share_url": share.share_url,
            "share_token": share.share_token
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create share")
```

**Acceptance Criteria**:

- [ ] Responsive grid layout displays live browser sessions
- [ ] Real-time status polling every 3 seconds with visual indicators
- [ ] Individual session cards show live browser iframes
- [ ] Batch progress overview with completion statistics
- [ ] Session detail expansion with step-by-step results
- [ ] Full-screen live browser viewing options
- [ ] Session logs and download functionality
- [ ] Smooth polling without UI performance issues

**Testing**:

- Display 3-5 concurrent live browser sessions in grid
- Verify real-time status updates and progress indicators
- Test responsive layout on different screen sizes
- Confirm iframe live browser sessions work correctly
- Test session detail expansion and result parsing
- Verify batch progress tracking accuracy
- Check performance with multiple concurrent iframe embeddings

---

## Phase 4: Results & User Experience (1-2 days)

### Task 4.1: Execution Results Collection & Display

**Priority**: High  
**Estimated Time**: 2-3 hours  
**Dependencies**: Task 3.4

**Description**: Collect and display comprehensive execution results for each flow.

**Implementation**:

- Implement result collection system for each agent
- Create success/failure determination logic
- Add execution timing and performance metrics
- Create results display component
- Implement result storage in Convex

**Acceptance Criteria**:

- [ ] Success/failure status for each flow
- [ ] Execution timing and performance data
- [ ] Detailed logs for each execution step
- [ ] Results stored persistently in database
- [ ] Clear results display on frontend

**Testing**:

- Execute flows and verify result accuracy
- Check timing measurement precision
- Test results persistence across sessions
- Verify result display clarity and completeness

---

### Task 4.2: Error Handling & User Feedback

**Priority**: High  
**Estimated Time**: 2-3 hours  
**Dependencies**: Task 4.1

**Description**: Implement comprehensive error handling and user feedback throughout the application.

**Implementation**:

- Add global error handling for all components
- Implement user-friendly error messages
- Create error recovery mechanisms
- Add loading states and progress indicators
- Implement user feedback for all actions

**Acceptance Criteria**:

- [ ] All errors show user-friendly messages
- [ ] Error recovery options provided where possible
- [ ] Loading states for all async operations
- [ ] Progress indicators for long-running tasks
- [ ] Success feedback for completed actions

**Testing**:

- Test various error scenarios
- Verify error message clarity and helpfulness
- Test error recovery mechanisms
- Check loading states and progress indicators

---

### Task 4.3: Simple Results Analysis & Re-execution

**Priority**: Medium  
**Estimated Time**: 2-3 hours  
**Dependencies**: Task 4.2

**Description**: Add basic results analysis and ability to re-execute specific flows.

**Implementation**:

- Create results summary component
- Add pass/fail statistics display
- Implement selective flow re-execution
- Add execution history tracking
- Create simple performance metrics display

**Acceptance Criteria**:

- [ ] Overall test run statistics displayed
- [ ] Individual flow results clearly shown
- [ ] Re-execute failed flows functionality
- [ ] Execution history accessible
- [ ] Basic performance metrics visible

**Testing**:

- Review results summary accuracy
- Test selective re-execution of failed flows
- Verify execution history completeness
- Check performance metrics calculation

---

## Phase 5: Performance & Production Readiness (1 day)

### Task 5.1: Performance Optimization & Resource Management

**Priority**: High  
**Estimated Time**: 3-4 hours  
**Dependencies**: Task 4.3

**Description**: Optimize performance for parallel browser sessions and resource usage.

**Implementation**:

- Implement session limits and queuing
- Add resource monitoring and alerts
- Optimize WebSocket message handling
- Implement memory and CPU usage tracking
- Add automatic cleanup mechanisms

**Acceptance Criteria**:

- [ ] System handles up to 5 concurrent sessions smoothly
- [ ] Resource usage monitored and controlled
- [ ] Automatic cleanup prevents memory leaks
- [ ] Queue system for excessive session requests
- [ ] Performance metrics displayed to users

**Testing**:

- Test maximum concurrent session limits
- Monitor resource usage during peak load
- Test automatic cleanup functionality
- Verify queue system operation

---

### Task 5.2: Production Deployment Preparation

**Priority**: Medium  
**Estimated Time**: 2-3 hours  
**Dependencies**: Task 5.1

**Description**: Prepare application for production deployment with proper configuration.

**Implementation**:

- Create environment configuration management
- Add production logging configuration
- Implement health check endpoints
- Create deployment documentation
- Add monitoring and alerting setup

**Acceptance Criteria**:

- [ ] Environment variables properly configured
- [ ] Production logging captures necessary information
- [ ] Health check endpoints respond correctly
- [ ] Deployment documentation complete
- [ ] Basic monitoring setup functional

**Testing**:

- Test application with production configuration
- Verify health check endpoint functionality
- Test deployment process documentation
- Check monitoring alerts and logging

---

## Continuous Testing Strategy

### Testing Approach

Each task includes a frontend testing component that immediately validates backend functionality:

1. **Immediate Feedback**: Every backend function accessible via frontend interface
2. **Visual Validation**: All backend processes have visual indicators on frontend
3. **Real-time Monitoring**: Live logs and status updates for all operations
4. **Error Visibility**: All errors immediately visible with actionable feedback
5. **Performance Tracking**: Real-time performance metrics displayed

### Quality Gates

Before completing each task:

- [ ] Backend functionality works correctly
- [ ] Frontend interface provides full access to backend features
- [ ] Real-time updates work without refresh
- [ ] Error handling provides clear feedback
- [ ] Performance remains acceptable
- [ ] Documentation updated

### MVP Success Criteria

- User can input natural language prompts
- System generates 3-5 relevant testing flows
- User can edit and approve flows
- System executes up to 5 parallel browser sessions
- Real-time progress visible for all sessions
- Comprehensive results displayed after execution
- System handles errors gracefully with user feedback

---

## Development Notes

### Browser Use Cloud Integration

**UPDATED APPROACH**: Using Browser Use Cloud API instead of local Browser Use library.

**Key Benefits**:

- ✅ No local browser management or resources needed
- ✅ Live session URLs provided for real-time viewing
- ✅ Cloud-hosted parallel browser sessions
- ✅ Built-in session recording and screenshots
- ✅ Automatic session management and cleanup

**Core API Integration Using Official SDK**:

```python
# Browser Use Cloud Integration (Updated)
from browser_use_sdk import BrowserUse
import asyncio
from datetime import datetime

# Initialize Browser Use client
client = BrowserUse(
    api_key=os.getenv("BROWSER_USE_API_KEY"),
)

# Create optimized agent profile for web testing
async def setup_testing_environment():
    """Set up agent and browser profiles for web testing"""
    # Create specialized agent profile
    agent_profile = client.agent_profiles.create(
        name="Web Testing Specialist",
        description="AI agent optimized for automated web testing and validation",
        max_agent_steps=50,
        vision=True,
        thinking=True,
        custom_system_prompt_extension="""
You are a professional web testing agent with expertise in:
- Automated web testing and validation
- Form filling and interaction testing
- Navigation and UI element verification
- Error detection and reporting
- Screenshot capture for documentation

Execute each test step methodically and report findings clearly.
"""
    )

    # Create browser profile for consistent testing environment
    browser_profile = client.browser_profiles.create(
        name="Testing Browser",
        description="Optimized browser settings for web testing",
        browser_viewport_width=1280,
        browser_viewport_height=960,
        ad_blocker=True,
        store_cache=False,  # Fresh environment for each test
        is_mobile=False
    )

    return agent_profile.id, browser_profile.id

# Execute flows with Browser Use Cloud
async def execute_flows_with_cloud(flows, agent_profile_id, browser_profile_id):
    """Execute multiple flows using Browser Use Cloud with live URLs"""
    execution_results = []

    for flow in flows:
        try:
            # Create task with optimized settings
            task = client.tasks.create(
                task=f"""
Test Target: {flow.get('target_url', 'https://example.com')}

Test Name: {flow.get('name', 'Web Test')}

Instructions:
{flow['instructions']}

Expected Outcome: {flow.get('expected_result', 'Complete test successfully')}

Please execute each step carefully, take screenshots of key actions,
and report any issues or unexpected behavior.
""",
                agent_settings={
                    "llm": "gpt-4o",  # Latest model for best performance
                    "start_url": flow.get('target_url'),
                    "profile_id": agent_profile_id
                },
                browser_settings={
                    "profile_id": browser_profile_id
                },
                structured_output_json=json.dumps({
                    "type": "object",
                    "properties": {
                        "test_passed": {"type": "boolean"},
                        "steps_completed": {"type": "array", "items": {"type": "string"}},
                        "issues_found": {"type": "array", "items": {"type": "string"}},
                        "final_status": {"type": "string"},
                        "recommendations": {"type": "array", "items": {"type": "string"}}
                    },
                    "required": ["test_passed", "final_status"]
                }),
                metadata={
                    "flow_id": flow.get('id'),
                    "flow_name": flow.get('name'),
                    "test_type": "automated_web_testing",
                    "execution_timestamp": datetime.utcnow().isoformat()
                }
            )

            # Get session with live URL
            session = client.sessions.retrieve(task.session_id)

            execution_results.append({
                "flow_id": flow.get('id'),
                "task_id": task.id,
                "session_id": task.session_id,
                "live_url": session.live_url,  # Critical: Live browser viewing
                "status": "started",
                "created_at": datetime.utcnow()
            })

            # Small delay to avoid rate limiting
            await asyncio.sleep(0.5)

        except Exception as e:
            logger.error(f"Failed to create task for flow {flow.get('id')}: {str(e)}")
            execution_results.append({
                "flow_id": flow.get('id'),
                "error": str(e),
                "status": "failed"
            })

    return execution_results

# Monitor execution progress
async def monitor_execution_progress(task_ids):
    """Monitor multiple tasks and return comprehensive status"""
    results = []

    for task_id in task_ids:
        try:
            task = client.tasks.retrieve(task_id)
            results.append({
                "task_id": task.id,
                "status": task.status,
                "is_success": task.is_success,
                "live_url": task.session.live_url,
                "steps_count": len(task.steps),
                "structured_output": task.done_output,
                "execution_time": (
                    task.finished_at - task.started_at
                    if task.finished_at else None
                )
            })
        except Exception as e:
            results.append({
                "task_id": task_id,
                "error": str(e),
                "status": "error"
            })

    return results
```

**Key Advantages of Browser Use Cloud Integration**:

- ✅ **Live Session URLs**: Each task provides `session.live_url` for real-time browser viewing
- ✅ **No Local Infrastructure**: Zero browser management, resources, or dependencies
- ✅ **Built-in Parallel Execution**: Each task gets isolated cloud browser session
- ✅ **Professional Agent Profiles**: Optimized AI agents for web testing scenarios
- ✅ **Structured Results**: JSON output schemas for consistent test reporting
- ✅ **Automatic Screenshots**: Built-in step recording and visual documentation
- ✅ **Session Sharing**: Public share URLs for collaboration and review

**Integration Benefits vs. Local Browser Use**:

| Feature               | Browser Use Cloud | Local Browser Use       |
| --------------------- | ----------------- | ----------------------- |
| Infrastructure        | ☁️ Zero setup     | 🔧 Complex setup        |
| Live Viewing          | ✅ Built-in URLs  | ❌ Custom streaming     |
| Parallel Execution    | ✅ Cloud native   | 🔧 Resource limited     |
| Session Recording     | ✅ Automatic      | 🔧 Manual setup         |
| Agent Optimization    | ✅ Cloud profiles | 🔧 Local config         |
| Sharing/Collaboration | ✅ Public URLs    | ❌ Not available        |
| Cost                  | 💰 Pay-per-use    | 🔧 Infrastructure costs |

### WebSocket Message Structure

```json
{
  "type": "session_update",
  "session_id": "uuid",
  "data": {
    "status": "running",
    "current_action": "Navigating to homepage",
    "progress": 0.3,
    "logs": ["Started session", "Navigation complete"]
  }
}
```

### Key Simplifications

- No authentication system (direct access)
- No file uploads (flows generated from text prompts only)
- No complex notifications (simple real-time status updates)
- No data export (results displayed in interface)
- No web scraping (Browser Use handles all browser interactions)
- No Playwright (Browser Use replacement)

This task structure ensures rapid MVP development with continuous testing and validation at every step.

---

## ✅ **COMPLETED TASKS - Browser Use Cloud Integration**

### Task 3.1: Browser Use Cloud API Integration ✅ **COMPLETED**

**What was completed:**

- ✅ Direct Browser Use Cloud API integration using simple HTTP calls
- ✅ Single task creation endpoint working perfectly
- ✅ Task status retrieval with live browser URLs
- ✅ Frontend test page for single task testing

**Key Implementation Insights:**

- **Simple is better**: Direct API calls work better than SDK
- **Live URLs**: Browser Use automatically provides live browser session URLs
- **No complex setup**: Just API key and HTTP requests

```python
# Working Implementation Pattern
def create_task():
    response = requests.post(
        "https://api.browser-use.com/api/v1/run-task",
        headers={"Authorization": f"Bearer {api_key}"},
        json={"task": "Navigate to google.com and search for AI"}
    )
    return response.json()["id"]  # Returns task ID immediately
```

### Task 3.2: Parallel Browser Flows ✅ **COMPLETED**

**What was completed:**

- ✅ Parallel task creation endpoint (`/api/browser-cloud/parallel-flows`)
- ✅ Multiple browser sessions running simultaneously
- ✅ Inspired by project_summary.md pattern: `await asyncio.gather(*[create_single_task(flow) for flow in flows])`
- ✅ Frontend interface for managing parallel flows

**Key Features:**

- **Batch execution**: Create multiple browser tasks in parallel
- **Independent sessions**: Each task runs in its own browser session
- **Live monitoring**: Each task provides its own live URL
- **Simple scaling**: Add more flows by just adding to the array

### Task 3.3: Real-time Streaming ✅ **COMPLETED**

**What was completed:**

- ✅ Server-Sent Events (SSE) streaming endpoint (`/task/{task_id}/stream`)
- ✅ Real-time step-by-step task monitoring
- ✅ Live status updates and error handling
- ✅ Frontend EventSource integration

**Streaming Features:**

- **Step streaming**: See each browser action as it happens
- **Status updates**: Real-time task status changes
- **Live URLs**: Automatic live browser session links
- **Error handling**: Graceful failure notifications

### Browser Use Cloud - Simplified Architecture

**What works perfectly:**

1. **Single Task**: Natural language → Browser Use Cloud → Live URL
2. **Parallel Tasks**: Multiple flows → Concurrent browser sessions → Multiple live URLs
3. **Real-time Monitoring**: Task streaming → Step-by-step updates → Completion notifications

**Frontend Test Pages:**

- `/browser-test` - Complete test interface with single tasks, parallel flows, and streaming
- Working endpoints: All Browser Use Cloud endpoints operational
- Live session viewing: Direct links to browser sessions

**Next Steps:**

- Remove unnecessary BrowserManager complexity
- Focus on flow generation integration
- Integrate with Convex for flow storage

---

## 📊 Progress Tracking

### Phase 1: Foundation & Real-time Infrastructure

- [x] **Task 1.1**: Basic FastAPI-Next.js Integration Test ✅ **COMPLETED**
- [x] **Task 1.2**: Streaming Response Real-time Communication Setup ✅ **COMPLETED**
- [x] **Task 1.3**: Convex Database Integration & Real-time Sync ✅ **COMPLETED**

### Phase 2: Flow Generation & Management

- [x] **Task 2.1**: LLM Integration for Flow Generation ✅ **COMPLETED**
- [ ] **Task 2.2**: Flow Editing & Management Interface
- [ ] **Task 2.3**: Flow Approval & Execution Preparation

### Phase 3: Browser Use Cloud Integration & Parallel Sessions

- [ ] **Task 3.1**: Browser Use Cloud API Integration & Single Session Test ⭐ **UPDATED**
- [ ] **Task 3.2**: Browser Cloud Agent Integration for Flow Execution ⭐ **UPDATED**
- [ ] **Task 3.3**: Parallel Cloud Browser Session Management ⭐ **UPDATED**
- [ ] **Task 3.4**: Live Browser Session Display & Real-time Status Updates ⭐ **UPDATED**

### Phase 4: Results & User Experience

- [ ] **Task 4.1**: Execution Results Collection & Display
- [ ] **Task 4.2**: Error Handling & User Feedback
- [ ] **Task 4.3**: Simple Results Analysis & Re-execution

### Phase 5: Performance & Production Readiness

- [ ] **Task 5.1**: Performance Optimization & Resource Management
- [ ] **Task 5.2**: Production Deployment Preparation

**Legend**: ✅ Completed | ⏳ In Progress | ⏸️ Blocked | ❌ Failed
