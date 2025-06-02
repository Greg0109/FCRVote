# Backend Documentation

The backend is built with FastAPI and provides a RESTful API for the voting application.

## Directory Structure

```
back/
├── auth/          # Authentication related code
├── database/      # Database configuration and models
├── models/        # SQLAlchemy models
├── routers/       # API route handlers
├── schemas/       # Pydantic schemas
├── config.py      # Configuration settings
├── main.py        # Application entry point
└── utils.py       # Utility functions
```

## Setup

1. Ensure you have Python 3.x installed
2. Create and activate the virtual environment:
   ```bash
   make venv
   ```
3. Install dependencies:
   ```bash
   make install
   ```

## Running the Server

Start the development server with hot reload:
```bash
make back
```

The server will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Database

The application uses SQLite by default. To reset the database:
```bash
make reset-db
```

## Development

- Code formatting is handled by Ruff:
  ```bash
  make format
  ```

## Testing

Run the test suite:
```bash
make test
``` 