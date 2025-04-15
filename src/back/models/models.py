from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from ..database.database import Base, get_db
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_president = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    photo = Column(String, nullable=True)

    @classmethod
    def add_admin(cls, username, password):
        db = next(get_db())
        admin = cls(username=username, hashed_password=get_password_hash(password), is_admin=True)
        db.add(admin)
        db.commit()
        return admin

class Candidate(Base):
    __tablename__ = "candidates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    description = Column(String, nullable=True)
    photo = Column(String, nullable=True)

class VotingSession(Base):
    __tablename__ = "voting_sessions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    description = Column(String, nullable=True)
    active = Column(Boolean, default=True)

class Vote(Base):
    __tablename__ = "votes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    session_id = Column(Integer, ForeignKey("voting_sessions.id"))
    stage = Column(Integer)  # 1 to 3