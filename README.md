# FCRVote

A full-stack voting application built with FastAPI and React.

## Project Structure

```
.
├── src/
│   ├── back/         # FastAPI backend
│   └── front/        # React frontend
├── docker/           # Docker configuration
└── Makefile         # Build and development commands
```

## Prerequisites

- Python 3.x
- Node.js and Yarn
- Docker (optional, for containerized deployment)

## Quick Start

1. Create and activate the virtual environment:
   ```bash
   make venv
   ```

2. Install dependencies:
   ```bash
   make install
   ```

3. Start the development servers:
   ```bash
   # Start backend
   make back
   
   # Start frontend (in a separate terminal)
   make front
   ```

## Available Commands

- `make venv` - Create virtual environment
- `make install` - Install dependencies
- `make back` - Start FastAPI server with reload
- `make front` - Start React development server
- `make format` - Format code with black
- `make reset-db` - Delete and recreate the SQLite DB
- `make build-front` - Build the frontend
- `make run-app` - Build frontend and run backend
- `make docker-build` - Build Docker image

## Docker Deployment

For containerized deployment, see the [Docker README](docker/README.md).

## Documentation

- [Backend Documentation](src/back/README.md)
- [Frontend Documentation](src/front/README.md)
- [Docker Documentation](docker/README.md)
