from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database.database import get_db
from ..models.models import User, Candidate
from ..auth.auth import get_password_hash
from ..schemas.schemas import CandidateCreate, UserCreate

router = APIRouter()

@router.post("/add_candidate")
def add_candidate(candidate_data: CandidateCreate, db: Session = Depends(get_db)):
    if db.query(Candidate).filter_by(name=candidate_data.name).first():
        raise HTTPException(status_code=400, detail="Candidate already exists")
    candidate = Candidate(name=candidate_data.name)
    db.add(candidate)
    db.commit()
    return {"message": "Candidate added"}

@router.get("/get_candidates")
def get_candidates(db: Session = Depends(get_db)):
    candidates = db.query(Candidate).all()
    return candidates

@router.delete("/remove_candidate/{candidate_id}")
def remove_candidate(candidate_id: int, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter_by(id=candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    db.delete(candidate)
    db.commit()
    return {"message": "Candidate removed"}

@router.post("/add_user")
def add_user(user_data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter_by(username=user_data.username).first():
        raise HTTPException(status_code=400, detail="User already exists")
    user = User(username=user_data.username, hashed_password=get_password_hash(user_data.password), is_president=user_data.is_president)
    db.add(user)
    db.commit()
    return {"message": "User added"}

@router.get("/get_users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users

@router.delete("/remove_user/{user_id}")
def remove_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User removed"}