from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import User, Booking
from ..schemas import UserSignUp, UserLogin, UserResponse, UserTokenResponse, BookingResponse
from ..auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["User Authentication"])

@router.post("/signup", response_model=UserTokenResponse, status_code=status.HTTP_201_CREATED)
def user_signup(data: UserSignUp, db: Session = Depends(get_db)):
    clean_email = data.email.strip().lower()
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please log in instead."
        )
    
    pwd_hash, salt = hash_password(data.password)
    user = User(
        email=clean_email,
        password_hash=pwd_hash,
        salt=salt,
        full_name=data.full_name.strip(),
        business_name=data.business_name.strip() if data.business_name else None,
        phone=data.phone.strip() if data.phone else None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": user.email, "role": "customer"})
    return UserTokenResponse(
        access_token=token,
        token_type="bearer",
        user=user
    )

@router.post("/login", response_model=UserTokenResponse)
def user_login(data: UserLogin, db: Session = Depends(get_db)):
    clean_email = data.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()
    
    if not user or not verify_password(data.password, user.password_hash, user.salt):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password. Please try again."
        )

    token = create_access_token(data={"sub": user.email, "role": "customer"})
    return UserTokenResponse(
        access_token=token,
        token_type="bearer",
        user=user
    )

@router.get("/me", response_model=UserResponse)
def get_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/my-bookings", response_model=List[BookingResponse])
def get_user_bookings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    bookings = db.query(Booking).filter(
        Booking.email == current_user.email
    ).order_by(Booking.created_at.desc()).all()
    return bookings

@router.get("/bookings-by-email", response_model=List[BookingResponse])
def get_bookings_by_email(email: str = Query(..., min_length=3), db: Session = Depends(get_db)):
    clean_email = email.strip().lower()
    bookings = db.query(Booking).filter(
        Booking.email == clean_email
    ).order_by(Booking.created_at.desc()).all()
    return bookings

