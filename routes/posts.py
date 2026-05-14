from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from database.session import get_db
from models.models import Post, User, UserRole, PostCategory
from schemas.schemas import PostCreate, PostOut
from utils.jwt import get_current_user

router = APIRouter()


@router.post("/", response_model=PostOut, status_code=status.HTTP_201_CREATED)
def create_post(
    data: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.tourist:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los turistas pueden crear publicaciones"
        )
    post = Post(**data.model_dump(), author_id=current_user.id)
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@router.get("/", response_model=List[PostOut])
def list_posts(
    city: Optional[str] = Query(None),
    category: Optional[PostCategory] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(Post)
    if city:
        query = query.filter(Post.city.ilike(f"%{city}%"))
    if category:
        query = query.filter(Post.category == category)
    return query.order_by(Post.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{post_id}", response_model=PostOut)
def get_post(post_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publicación no encontrada")
    return post


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publicación no encontrada")
    if post.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso para eliminar esta publicación")
    db.delete(post)
    db.commit()
