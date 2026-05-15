from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from database.session import Base


class UserRole(str, enum.Enum):
    tourist = "tourist"
    local = "local"


class PostCategory(str, enum.Enum):
    food = "food"
    tourism = "tourism"
    nightlife = "nightlife"
    shopping = "shopping"
    activities = "activities"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    city = Column(String(100), nullable=True)
    avatar_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    posts = relationship("Post", back_populates="author")
    responses = relationship("Response", back_populates="author")


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    category = Column(Enum(PostCategory), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    author = relationship("User", back_populates="posts")
    responses = relationship("Response", back_populates="post")


class Response(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    post = relationship("Post", back_populates="responses")
    author = relationship("User", back_populates="responses")
    rating = relationship("Rating", back_populates="response", uselist=False)


class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    score = Column(Float, nullable=False)  # 0.0 to 5.0
    response_id = Column(Integer, ForeignKey("responses.id"), unique=True, nullable=False)
    rated_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    response = relationship("Response", back_populates="rating")


class Tip(Base):
    __tablename__ = "tips"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD")
    paypal_order_id = Column(String(255), nullable=False)
    paypal_status = Column(String(50), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    response_id = Column(Integer, ForeignKey("responses.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
