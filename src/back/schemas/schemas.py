from pydantic import BaseModel
from typing import Optional, List

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Schema for creating a candidate
class CandidateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    photo: Optional[str] = None

# Schema for creating a user
class UserCreate(BaseModel):
    username: str
    password: str
    is_president: bool = False
    is_admin: bool = False
    photo: Optional[str] = None

class CandidateOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    photo: Optional[str] = None
    class Config:
        from_attributes = True

# Schema for user output (excluding password)
class UserOut(BaseModel):
    id: int
    username: str
    photo: Optional[str] = None
    is_president: bool
    is_admin: bool

    class Config:
        from_attributes = True

class SessionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    active: Optional[bool] = True

class SessionOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    active: bool

    class Config:
        from_attributes = True

class UserVotesOut(BaseModel):
    user_id: int
    session_id: int
    stage: int
    votes: int

    class Config:
        from_attributes = True

class VotingStatusOut(BaseModel):
    title: str
    votes_remaining: int
    is_tie: bool
    waiting_message: Optional[str] = None
    winner: Optional[dict] = None

    class Config:
        from_attributes = True

class StageResult(BaseModel):
    candidate_id: int
    points: int
    name: str
    photo: Optional[str] = None
    description: Optional[str] = None
    total_points: int

    class Config:
        from_attributes = True

class ResultsOut(BaseModel):
    current_stage: int
    results: List[StageResult]

    class Config:
        from_attributes = True
