from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from models.models import UserRole, PostCategory


# ── Auth ──────────────────────────────────────────────

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: UserRole
    city: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── Users ─────────────────────────────────────────────

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: UserRole
    city: Optional[str]
    avatar_url: Optional[str] = None   # ← agrega esto
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    avatar_url: Optional[str] = None   # ← agrega esto

# ── Posts ─────────────────────────────────────────────

class PostCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    content: str = Field(..., min_length=10)
    city: str = Field(..., min_length=2, max_length=100)
    category: PostCategory


class PostOut(BaseModel):
    id: int
    title: str
    content: str
    city: str
    category: PostCategory
    author_id: int
    author: UserOut
    created_at: datetime

    class Config:
        from_attributes = True

class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    city: Optional[str] = None
    category: Optional[PostCategory] = None


# ── Responses ─────────────────────────────────────────

class ResponseCreate(BaseModel):
    content: str = Field(..., min_length=10)


class ResponseOut(BaseModel):
    id: int
    content: str
    post_id: int
    author_id: int
    author: UserOut
    created_at: datetime

    class Config:
        from_attributes = True


# ── Ratings ───────────────────────────────────────────

class RatingCreate(BaseModel):
    score: float = Field(..., ge=0.0, le=5.0)
    response_id: int


class RatingOut(BaseModel):
    id: int
    score: float
    response_id: int
    rated_by: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Payments ──────────────────────────────────────────

class TipCreate(BaseModel):
    amount: float = Field(..., gt=0)
    currency: str = "USD"
    response_id: int
    receiver_id: int


class TipOut(BaseModel):
    id: int
    amount: float
    currency: str
    paypal_order_id: str
    paypal_status: str
    sender_id: int
    receiver_id: int
    response_id: int
    created_at: datetime

    class Config:
        from_attributes = True
