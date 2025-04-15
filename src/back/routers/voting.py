from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session
from ..database.database import SessionLocal, get_db
from ..models.models import User, Candidate, Vote, VotingSession
from ..schemas.schemas import CandidateOut
from ..auth.auth import get_current_user
from sqlalchemy import func

router = APIRouter()

@router.get("/candidates", response_model=List[CandidateOut])
def list_candidates(db: Session = Depends(get_db)):
    return db.query(Candidate).all()

@router.post("/vote/{candidate_id}/{stage}")
def vote(candidate_id: int, stage: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Get current active session
    current_session = db.query(VotingSession).filter_by(active=True).first()
    if not current_session:
        raise HTTPException(status_code=400, detail="No active voting session")
    
    if stage not in [1, 2, 3]:
        raise HTTPException(status_code=400, detail="Invalid stage")
    
    # Check if user has already voted 3 times in this stage
    vote_count = db.query(Vote).filter_by(
        user_id=current_user.id,
        stage=stage,
        session_id=current_session.id
    ).count()
    
    if vote_count >= 3:
        raise HTTPException(status_code=400, detail="You have already cast all your votes for this stage")
    
    # Check if candidate exists
    candidate = db.query(Candidate).filter_by(id=candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Record the vote
    vote = Vote(
        user_id=current_user.id,
        candidate_id=candidate_id,
        stage=stage,
        session_id=current_session.id
    )
    db.add(vote)
    db.commit()
    
    # Check if all users have completed voting for this stage
    total_users = db.query(User).filter_by(is_admin=False).count()
    users_voted = db.query(Vote.user_id).filter_by(
        stage=stage,
        session_id=current_session.id
    ).distinct().count()
    
    if users_voted == total_users and vote_count == 2:  # Last vote for this user
        # Check if all users have cast all their votes
        total_votes = db.query(Vote).filter_by(
            stage=stage,
            session_id=current_session.id
        ).count()
        
        if total_votes == total_users * 3:  # All users have cast all their votes
            # Move to next stage
            current_session.stage = stage + 1
            db.commit()
            return {"message": "Vote recorded. All users have completed voting for this stage. Moving to next stage."}
    
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