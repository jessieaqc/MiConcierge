from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.session import get_db
from models.models import Rating, Response, User, UserRole
from schemas.schemas import RatingCreate, RatingOut
from utils.jwt import get_current_user

router = APIRouter()


@router.post("/", response_model=RatingOut, status_code=status.HTTP_201_CREATED)
def rate_response(
    data: RatingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.tourist:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los turistas pueden calificar respuestas"
        )
    response = db.query(Response).filter(Response.id == data.response_id).first()
    if not response:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Respuesta no encontrada")

    existing = db.query(Rating).filter(
        Rating.response_id == data.response_id,
        Rating.rated_by == current_user.id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya calificaste esta respuesta"
        )

    rating = Rating(score=data.score, response_id=data.response_id, rated_by=current_user.id)
    db.add(rating)
    db.commit()
    db.refresh(rating)
    return rating


@router.get("/{response_id}", response_model=RatingOut)
def get_rating(response_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rating = db.query(Rating).filter(Rating.response_id == response_id).first()
    if not rating:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Calificación no encontrada")
    return rating
