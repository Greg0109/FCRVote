from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session
from ..database.database import SessionLocal, get_db
from ..models.models import User, Candidate, Vote
from ..schemas.schemas import CandidateOut
from ..auth.auth import get_current_user

router = APIRouter()

@router.get("/candidates", response_model=List[CandidateOut])
def list_candidates(db: Session = Depends(get_db)):
    return db.query(Candidate).all()

@router.post("/vote/{candidate_id}/{stage}")
def vote(candidate_id: int, stage: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if stage not in [1, 2]:
        raise HTTPException(status_code=400, detail="Invalid stage")
    existing_vote = db.query(Vote).filter_by(user_id=current_user.id, stage=stage).first()
    if existing_vote:
        raise HTTPException(status_code=400, detail="Already voted in this stage")
    vote = Vote(user_id=current_user.id, candidate_id=candidate_id, stage=stage)
    db.add(vote)
    db.commit()
    return {"message": "Vote recorded"}

@router.get("/results/{stage}")
def results(stage: int, db: Session = Depends(get_db)):
    from collections import defaultdict
    results = defaultdict(int)
    for v in db.query(Vote).filter_by(stage=stage).all():
        results[v.candidate_id] += 1
    sorted_results = sorted(results.items(), key=lambda x: x[1], reverse=True)
    return [{"candidate_id": cid, "votes": count} for cid, count in sorted_results]

@router.post("/resolve_tie/{stage}")
def resolve_tie(stage: int, winner_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
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