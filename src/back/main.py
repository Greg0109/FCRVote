from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database.database import engine, Base, get_db
from .routers import auth, voting, admin, users
from .models.models import User

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(voting.router, prefix="/voting")
app.include_router(admin.router, prefix="/admin")
app.include_router(users.router, prefix="/users")

if not next(get_db()).query(User).filter_by(is_admin=True).first():
    user_model = User()
    user_model.add_admin("admin", "1234")