from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from back.database.database import get_db
from back.auth.auth import get_current_user
from back.schemas.schemas import UserOut
from back.models.models import User

router = APIRouter()

@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Fetch the details of the currently logged-in user.
    """
    return current_user 