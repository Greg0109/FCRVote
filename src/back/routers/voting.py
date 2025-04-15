from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session
from ..database.database import SessionLocal, get_db
from ..models.models import User, Candidate, Vote, VotingSession
from ..schemas.schemas import CandidateOut
from ..auth.auth import get_current_user
from sqlalchemy import func
from collections import defaultdict

router = APIRouter()

@router.get("/candidates/{stage}", response_model=List[CandidateOut])
def list_candidates(stage: int = 1, db: Session = Depends(get_db)):
    if stage == 1:
        return db.query(Candidate).all()
    
    # For stages 2 and 3, get only the top candidates from previous stage
    current_session = db.query(VotingSession).filter_by(active=True).first()
    if not current_session:
        raise HTTPException(status_code=400, detail="No active voting session")
    
    # Get results from previous stage
    prev_stage = stage - 1
    results = defaultdict(int)
    for v in db.query(Vote).filter_by(stage=prev_stage, session_id=current_session.id).all():
        results[v.candidate_id] += v.points
    
    # Sort by points and get top candidates
    sorted_results = sorted(results.items(), key=lambda x: x[1], reverse=True)
    
    # Get top 2 candidates, or 3 if there's a tie for second place
    top_candidates = []
    if len(sorted_results) >= 2:
        top_candidates = [sorted_results[0][0]]  # First place
        if len(sorted_results) >= 3 and sorted_results[1][1] == sorted_results[2][1]:
            # If there's a tie for second place, include all tied candidates
            second_place_points = sorted_results[1][1]
            for candidate_id, points in sorted_results[1:]:
                if points == second_place_points:
                    top_candidates.append(candidate_id)
                else:
                    break
        else:
            top_candidates.append(sorted_results[1][0])  # Second place
    
    return db.query(Candidate).filter(Candidate.id.in_(top_candidates)).all()

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
    
    # Calculate points based on vote order (3, 2, 1)
    points = 3 - vote_count
    
    # Record the vote
    vote = Vote(
        user_id=current_user.id,
        candidate_id=candidate_id,
        stage=stage,
        session_id=current_session.id,
        points=points
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
        results[v.candidate_id] += v.points
    sorted_results = sorted(results.items(), key=lambda x: x[1], reverse=True)
    return [{"candidate_id": cid, "points": count} for cid, count in sorted_results]

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