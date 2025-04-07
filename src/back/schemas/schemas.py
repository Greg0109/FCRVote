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

# Schema for creating a user
class UserCreate(BaseModel):
    username: str
    password: str
    is_president: bool = False

class CandidateOut(BaseModel):
    id: int
    name: str
    class Config:
        orm_mode = True

# Schema for user output (excluding password)
class UserOut(BaseModel):
    id: int
    username: str
    is_president: bool
    class Config:
        orm_mode = True 