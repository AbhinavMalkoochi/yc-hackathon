# FastAPI Backend

This is the FastAPI backend server for the YC Agent project.

## Setup

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

2. Run the development server:

```bash
python main.py
```

The server will be available at `http://localhost:8000`

## API Endpoints

- `GET /` - Root endpoint
- `GET /api/message` - Get a message from the backend
- `GET /health` - Health check endpoint

## API Documentation

Once the server is running, you can view the automatic API documentation at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

