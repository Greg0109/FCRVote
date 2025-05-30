from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from back.database.database import get_db
from back.models.models import VotingSession, Vote
from back.auth.auth import get_password_hash

router = APIRouter()

@router.post("/start_session")
def start_session(db: Session = Depends(get_db)):
    """
    Start a new voting session.
    """
    existing_session = db.query(VotingSession).filter_by(active=True).first()
    if existing_session:
        raise HTTPException(status_code=400, detail="Session already exists")

    todays_date = datetime.today().date()
    amount_of_sessions = db.query(VotingSession).count()

    session = VotingSession(
        name=f"Session_{amount_of_sessions + 1}",
        description=str(todays_date),
        active=True,
        stage=1
    )
    db.add(session)
    db.commit()
    return {"message": "Voting session started successfully"}

@router.post("/end_session")
def end_session(db: Session = Depends(get_db)):
    """
    End the current voting session.
    """
    session = db.query(VotingSession).filter_by(active=True).first()
    if not session:
        raise HTTPException(status_code=400, detail="No active session to end")

    session.active = False
    db.commit()
    return {"message": "Voting session ended successfully"}

@router.get("/current_session")
def current_session(db: Session = Depends(get_db)):
    """
    Get the current active voting session.
    """
    session = db.query(VotingSession).filter_by(active=True).first()
    if not session:
        raise HTTPException(status_code=404, detail="No active session found")
    return session

@router.get("/sessions")
def get_sessions(db: Session = Depends(get_db)):
    """
    Get all voting sessions.
    """
    sessions = db.query(VotingSession).all()
    return sessions

@router.delete("/delete_session/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db)):
    """
    Delete a voting session by ID.
    """
    session = db.query(VotingSession).filter_by(id=session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    votes = db.query(Vote).filter_by(session_id=session.id).count()
    if votes > 0:
        db.query(Vote).filter_by(session_id=session.id).delete()

    db.delete(session)
    db.commit()
    return {"message": "Voting session deleted successfully"}