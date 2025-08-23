# AI Browser Testing Agent

An intelligent testing platform that combines AI-powered test generation with automated browser execution for comprehensive web application testing.

## 🏗️ Project Architecture

The project follows a modular architecture with clear separation of concerns:

### Backend (FastAPI)

```
backend/
├── config.py              # Configuration and environment variables
├── models.py              # Pydantic data models and schemas
├── main.py                # Main FastAPI application entry point
├── browser_service.py     # Local browser automation service
├── services/              # Business logic services
│   ├── llm_service.py     # Google Gemini LLM integration
│   ├── streaming_service.py # Server-Sent Events handling
│   └── browser_use_cloud_service.py # Browser Use Cloud API
├── routes/                # API endpoint definitions
│   ├── core.py            # Basic endpoints and health checks
│   ├── llm.py             # LLM flow generation endpoints
│   └── browser.py         # Browser automation endpoints
└── requirements.txt       # Python dependencies
```

### Frontend (Next.js + Convex)

```
app/                       # Next.js app directory
├── page.tsx               # Main landing page
├── test/                  # API integration testing
├── streaming-test/        # Real-time streaming testing
├── convex-test/           # Database operations testing
├── flow-generation-test/  # LLM flow generation testing
├── globals.css            # Global styles
└── layout.tsx             # Root layout with Convex provider

components/                 # Reusable React components
├── ui/                    # Base UI components
│   ├── Button.tsx         # Reusable button component
│   ├── Card.tsx           # Content container component
│   └── Input.tsx          # Form input component
├── features/               # Feature-specific components
│   ├── FlowGeneration.tsx # LLM flow generation interface
│   └── StreamingTest.tsx  # Streaming communication interface
├── layout/                 # Layout components
│   └── Header.tsx         # Navigation header
└── ConvexClientProvider.tsx # Convex real-time database provider

convex/                    # Convex database and functions
├── schema.ts              # Database schema definition
├── browserTesting.ts      # Browser testing functions
├── userSessions.ts        # User session management
└── myFunctions.ts         # Additional utility functions

lib/                       # Utility libraries
└── api.ts                 # FastAPI client utilities
```

## 🚀 Features

### ✅ Completed

- **Task 1.1**: Basic FastAPI-Next.js Integration Test
- **Task 1.2**: Streaming Response Implementation (Server-Sent Events)
- **Task 1.3**: Convex Database Integration (Real-time operations)
- **Task 2.1**: LLM Flow Generation (Google Gemini integration)

### 🔄 In Progress

- **Task 2.2**: Enhanced Flow Editing & Management Interface
- **Task 3.1**: Browser Use Library Setup and Testing

### 📋 Planned

- **Task 2.3**: Flow Approval & Execution Preparation
- **Task 3.2**: Browser Agent Integration for Flow Execution
- **Task 3.3**: Parallel Browser Session Management

## 🛠️ Technology Stack

### Backend

- **FastAPI**: Modern Python web framework
- **Google Gemini**: AI-powered test flow generation
- **Browser Use**: Local browser automation library
- **Browser Use Cloud**: Remote browser automation service

### Frontend

- **Next.js 14**: React framework with app directory
- **Convex**: Real-time database with TypeScript
- **Tailwind CSS**: Utility-first CSS framework
- **TypeScript**: Type-safe JavaScript development

## 📦 Installation & Setup

### Prerequisites

- Python 3.8+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend
pip install -r requirements.txt

# Set environment variables
export GEMINI_API_KEY="your_gemini_api_key"
export BROWSER_USE_API_KEY="your_browser_use_api_key"

# Start FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
# Install dependencies
npm install

# Set up Convex (first time only)
npx convex dev

# Start development server
npm run dev
```

## 🔧 Configuration

### Environment Variables

```bash
# Required for LLM features
GEMINI_API_KEY=your_gemini_api_key_here

# Required for Browser Use Cloud
BROWSER_USE_API_KEY=your_browser_use_api_key_here

# Optional
LOG_LEVEL=INFO
```

### Convex Configuration

The frontend uses Convex for real-time database operations. Configuration is handled automatically through the Convex dashboard.

## 📚 API Documentation

### Interactive Docs

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Key Endpoints

- `GET /health` - Service health check
- `GET /api/stream` - Real-time streaming endpoint
- `POST /api/generate-flows` - LLM flow generation
- `POST /api/browser/session/create` - Browser session creation
- `POST /api/browser-cloud/create-task` - Remote browser task creation

## 🧪 Testing

### Backend Testing

```bash
cd backend
python -m pytest tests/
```

### Frontend Testing

```bash
npm run test
npm run test:e2e
```

## 📖 Development Workflow

1. **Feature Development**: Each new feature gets its own test page
2. **Interactive Testing**: Use dedicated test interfaces to verify functionality
3. **Real-time Feedback**: Live logging and error handling for immediate debugging
4. **Progressive Enhancement**: Build upon previous tasks with cumulative testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Check the [documentation](docs/)
- Review existing [issues](../../issues)
- Create a new [issue](../../issues/new)

## 🔮 Roadmap

### Phase 4: Advanced Testing Features

- Test result analytics and reporting
- Performance testing integration
- Cross-browser compatibility testing
- Mobile device simulation

### Phase 5: Enterprise Features

- Team collaboration and sharing
- Advanced scheduling and automation
- Integration with CI/CD pipelines
- Custom test framework support
