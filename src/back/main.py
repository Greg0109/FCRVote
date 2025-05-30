from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import uvicorn
from back.database.database import engine, Base, get_db
from back.routers import auth, voting, admin, users, voting_sessions
from back.models.models import User

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://192.168.1.201:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(voting.router, prefix="/voting")
app.include_router(admin.router, prefix="/admin")
app.include_router(users.router, prefix="/users")
app.include_router(voting_sessions.router, prefix="/voting_sessions")

if os.getenv("ENV") == "production":
    # Navigate to the frontend build directory
    frontend_build_dir = "/home/front"

    # Mount the static files directory
    app.mount("/static", StaticFiles(directory=os.path.join(frontend_build_dir, "static")), name="static")
    app.mount("/assets", StaticFiles(directory=frontend_build_dir), name="assets")

    # Route to serve the index.html for any path not matched by the API routes
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(request: Request, full_path: str):
        # Exclude API paths
        if full_path.startswith(("api/", "docs", "redoc", "openapi.json")):
            return None  # Let FastAPI handle API routes

        # Serve the index.html for all other routes (to support client-side routing)
        return FileResponse(os.path.join(frontend_build_dir, "index.html"))

if not next(get_db()).query(User).filter_by(is_admin=True).first():
    user_model = User()
    user_model.add_admin("admin", "1234")

def main():
    """Start the uvicorn server."""
    uvicorn.run(
        "back.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if os.getenv("ENV") != "production" else False
    )

if __name__ == "__main__":
    main()
