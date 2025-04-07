from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import sessionmaker, declarative_base

from fastapi.middleware.cors import CORSMiddleware

# Config
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Database
SQLALCHEMY_DATABASE_URL = "sqlite:///./voting.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_president = Column(Boolean, default=False)

class Candidate(Base):
    __tablename__ = "candidates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)

class Vote(Base):
    __tablename__ = "votes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    stage = Column(Integer)  # 1 or 2

Base.metadata.create_all(bind=engine)

# Pydantic schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserInDB(User):
    pass

class CandidateOut(BaseModel):
    id: int
    name: str
    class Config:
        orm_mode = True

# Utility functions
def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_user(db, username: str):
    return db.query(User).filter(User.username == username).first()

def authenticate_user(db, username: str, password: str):
    user = get_user(db, username)
    if not user or not verify_password(password, user.hashed_password):
        return False
    return user

def get_current_user(token: str = Depends(oauth2_scheme), db: SessionLocal = Depends()):
    credentials_exception = HTTPException(status_code=401, detail="Invalid credentials")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Routes
@app.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: SessionLocal = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": user.username}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/candidates", response_model=List[CandidateOut])
def list_candidates(db: SessionLocal = Depends(get_db)):
    return db.query(Candidate).all()

@app.post("/vote/{candidate_id}/{stage}")
def vote(candidate_id: int, stage: int, current_user: User = Depends(get_current_user), db: SessionLocal = Depends(get_db)):
    if stage not in [1, 2]:
        raise HTTPException(status_code=400, detail="Invalid stage")
    existing_vote = db.query(Vote).filter_by(user_id=current_user.id, stage=stage).first()
    if existing_vote:
        raise HTTPException(status_code=400, detail="Already voted in this stage")
    vote = Vote(user_id=current_user.id, candidate_id=candidate_id, stage=stage)
    db.add(vote)
    db.commit()
    return {"message": "Vote recorded"}

@app.get("/results/{stage}")
def results(stage: int, db: SessionLocal = Depends(get_db)):
    from collections import defaultdict
    results = defaultdict(int)
    for v in db.query(Vote).filter_by(stage=stage).all():
        results[v.candidate_id] += 1
    sorted_results = sorted(results.items(), key=lambda x: x[1], reverse=True)
    return [{"candidate_id": cid, "votes": count} for cid, count in sorted_results]

@app.post("/resolve_tie/{stage}")
def resolve_tie(stage: int, winner_id: int, current_user: User = Depends(get_current_user), db: SessionLocal = Depends(get_db)):
    if not current_user.is_president:
        raise HTTPException(status_code=403, detail="Only the president can resolve ties")
    tied_votes = db.query(Vote).filter_by(stage=stage).all()
    if not tied_votes:
        raise HTTPException(status_code=404, detail="No votes to resolve")
    # Clear existing votes in tie-breaking round (for simplicity)
    db.query(Vote).filter_by(stage=stage).delete()
    db.commit()
    db.add(Vote(user_id=current_user.id, candidate_id=winner_id, stage=stage))
    db.commit()
    return {"message": "Tie resolved by president"}

# Admin helpers (optional)
@app.post("/admin/add_candidate")
def add_candidate(name: str, db: SessionLocal = Depends(get_db)):
    if db.query(Candidate).filter_by(name=name).first():
        raise HTTPException(status_code=400, detail="Candidate already exists")
    candidate = Candidate(name=name)
    db.add(candidate)
    db.commit()
    return {"message": "Candidate added"}

@app.post("/admin/add_user")
def add_user(username: str, password: str, is_president: bool = False, db: SessionLocal = Depends(get_db)):
    if db.query(User).filter_by(username=username).first():
        raise HTTPException(status_code=400, detail="User already exists")
    user = User(username=username, hashed_password=get_password_hash(password), is_president=is_president)
    db.add(user)
    db.commit()
    return {"message": "User added"}