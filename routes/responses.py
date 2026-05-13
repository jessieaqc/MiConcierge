from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database.session import get_db
from models.models import Response, Post, User, UserRole
from schemas.schemas import ResponseCreate, ResponseOut
from utils.jwt import get_current_user

router = APIRouter()


@router.post("/{post_id}", response_model=ResponseOut, status_code=status.HTTP_201_CREATED)
def create_response(
    post_id: int,
    data: ResponseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.local:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los locales pueden responder publicaciones"
        )
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publicación no encontrada")

    response = Response(content=data.content, post_id=post_id, author_id=current_user.id)
    db.add(response)
    db.commit()
    db.refresh(response)
    return response


@router.get("/{post_id}", response_model=List[ResponseOut])
def list_responses(
    post_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publicación no encontrada")
    return db.query(Response).filter(Response.post_id == post_id).all()


@router.delete("/{response_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_response(
    response_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    response = db.query(Response).filter(Response.id == response_id).first()
    if not response:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Respuesta no encontrada")
    if response.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso para eliminar esta respuesta")
    db.delete(response)
    db.commit()
