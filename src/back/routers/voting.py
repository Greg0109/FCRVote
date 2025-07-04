from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session
from back.database.database import get_db
from back.models.models import User, Candidate, Vote, VotingSession
from back.schemas.schemas import CandidateOut, VotingStatusOut, ResultsOut
from back.auth.auth import get_current_user
from collections import defaultdict
from back.utils import get_title_or_message

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

    if vote_count >= 3 and stage == 1:
        raise HTTPException(status_code=400, detail="You have already cast all your votes for this stage")
    elif vote_count >= 1 and stage > 1:
        raise HTTPException(status_code=400, detail="You have already cast all your votes for this stage")

    # Check if candidate exists
    candidate = db.query(Candidate).filter_by(id=candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Check if the user already voted for the candidate in this stage
    existing_vote = db.query(Vote).filter_by(
        user_id=current_user.id,
        candidate_id=candidate_id,
        stage=stage,
        session_id=current_session.id
    ).first()
    if existing_vote:
        raise HTTPException(status_code=400, detail="You have already voted for this candidate in this stage")

    # Calculate points based on vote order (3, 2, 1)
    points = 3 - vote_count if stage == 1 else 1

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

    if (users_voted == total_users and ((stage == 1 and vote_count == 2) or (stage > 1 and vote_count == 0))):  # Último voto para este usuario
        # Verificar si todos los usuarios han emitido todos sus votos
        total_votes = db.query(Vote).filter_by(
            stage=stage,
            session_id=current_session.id
        ).count()

        if (stage == 1 and total_votes == total_users * 3) or (stage > 1 and total_votes == total_users):  # Todos los usuarios han emitido todos sus votos
            # Pasar a la siguiente etapa
            current_session.stage = stage + 1
            db.commit()
            return {"message": "Vote recorded. All users have completed voting for this stage. Moving to next stage."}

    return {"message": "Vote recorded"}

@router.get("/results/{stage}", response_model=ResultsOut)
def results(stage: int, db: Session = Depends(get_db)):
    # Get current active session
    current_session = db.query(VotingSession).filter_by(active=True).first()
    if not current_session:
        raise HTTPException(status_code=400, detail="No active voting session")

    # Get all candidates
    candidates = db.query(Candidate).all()
    candidate_dict = {c.id: c for c in candidates}

    # Calculate points for current stage
    current_stage_results = defaultdict(int)
    for v in db.query(Vote).filter_by(stage=stage, session_id=current_session.id).all():
        current_stage_results[v.candidate_id] += v.points

    # Add candidates with 0 points to the results
    for candidates in list_candidates(stage=stage, db=db):
        if candidates.id not in current_stage_results:
            current_stage_results[candidates.id] = 0

    # Calculate total points across all stages
    total_points = defaultdict(int)
    for v in db.query(Vote).filter_by(session_id=current_session.id).all():
        total_points[v.candidate_id] += v.points

    # Combine results
    results = []
    for candidate_id in current_stage_results:
        candidate = candidate_dict.get(candidate_id)
        if candidate:
            results.append({
                "candidate_id": candidate_id,
                "points": current_stage_results[candidate_id],
                "name": candidate.name,
                "photo": candidate.photo,
                "description": candidate.description,
                "total_points": total_points[candidate_id]
            })

    # Sort by current stage points
    results.sort(key=lambda x: x["points"], reverse=True)

    return {
        "current_stage": stage,
        "results": results
    }

@router.get("/winner")
def get_winner(db: Session = Depends(get_db)):
    """
    Calculate and return the final winner based on all stages of voting.
    If there was a tie in stage 2, the president's vote in stage 3 determines the winner.
    """
    current_session = db.query(VotingSession).filter_by(active=True).first()
    if not current_session:
        raise HTTPException(status_code=400, detail="No active voting session")

    # Check if we're in stage 3 or beyond
    if current_session.stage < 3:
        raise HTTPException(status_code=400, detail="Voting is not complete yet")

    # Check if there was a tie in stage 2
    stage2_results = defaultdict(int)
    for v in db.query(Vote).filter_by(stage=2, session_id=current_session.id).all():
        stage2_results[v.candidate_id] += v.points

    sorted_stage2 = sorted(stage2_results.items(), key=lambda x: x[1], reverse=True)

    # If there are less than 2 candidates with votes, return the one with votes or an error
    if len(sorted_stage2) == 0:
        raise HTTPException(status_code=404, detail="No votes recorded in stage 2")
    elif len(sorted_stage2) == 1:
        winner_id = sorted_stage2[0][0]
    else:
        # Check if there was a tie between first and second place
        is_tie = sorted_stage2[0][1] == sorted_stage2[1][1]

        if is_tie:
            # If there was a tie, check stage 3 for the president's tie-breaking vote
            stage3_votes = db.query(Vote).filter_by(stage=3, session_id=current_session.id).all()
            if not stage3_votes:
                raise HTTPException(status_code=400, detail="Tie detected but no tie-breaker vote found")

            # The president's vote determines the winner
            winner_id = stage3_votes[0].candidate_id
        else:
            # If no tie, the winner is the candidate with the most points in stage 2
            winner_id = sorted_stage2[0][0]

    # Get the winner's details
    winner = db.query(Candidate).filter_by(id=winner_id).first()
    if not winner:
        raise HTTPException(status_code=404, detail="Winner candidate not found")

    # sum all the points the winner got in all the stages
    total_points = 0
    for v in db.query(Vote).filter_by(candidate_id=winner_id, session_id=current_session.id).all():
        total_points += v.points

    return {
        "candidate_id": winner.id,
        "name": winner.name,
        "photo": winner.photo,
        "description": winner.description,
        "points": total_points
    }

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

@router.get("/voting_status", response_model=VotingStatusOut)
def get_voting_status(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Get the current voting status for the user, including title, votes remaining, and tie status.
    """
    # Get current active session
    current_session = db.query(VotingSession).filter_by(active=True).first()
    if not current_session:
        raise HTTPException(status_code=400, detail="No active voting session")

    current_stage = current_session.stage

    # Calculate votes remaining for the user
    vote_count = db.query(Vote).filter_by(
        user_id=current_user.id,
        stage=current_stage,
        session_id=current_session.id
    ).count()

    # Calculate votes remaining based on stage
    if current_stage == 1:
        votes_remaining = 3 - vote_count
    else:
        votes_remaining = 1 - vote_count

    # Check for tie in stage 2 if we're in stage 3
    is_tie = False
    if current_stage == 3:
        # Get results from stage 2
        stage2_results = defaultdict(int)
        for v in db.query(Vote).filter_by(stage=2, session_id=current_session.id).all():
            stage2_results[v.candidate_id] += v.points

        sorted_stage2 = sorted(stage2_results.items(), key=lambda x: x[1], reverse=True)

        # Check if there's a tie between first and second place
        if len(sorted_stage2) >= 2:
            is_tie = sorted_stage2[0][1] == sorted_stage2[1][1]

    # Try to get winner if we're in stage 3
    winner = None
    if current_stage == 3:
        try:
            winner_data = get_winner(db=db)
            winner = winner_data
        except HTTPException:
            # No winner yet
            pass

    title, waiting_message = get_title_or_message(current_stage, current_user, is_tie, votes_remaining, winner)

    return {
        "title": title,
        "votes_remaining": votes_remaining,
        "is_tie": is_tie,
        "waiting_message": waiting_message,
        "winner": winner
    }


