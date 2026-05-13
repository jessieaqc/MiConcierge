"""Initial migration — create all tables

Revision ID: 0001
Revises: 
Create Date: 2024-01-01 00:00:00
"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("email", sa.String(150), unique=True, nullable=False, index=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("tourist", "local", name="userrole"), nullable=False),
        sa.Column("city", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "posts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column(
            "category",
            sa.Enum("food", "tourism", "nightlife", "shopping", "activities", name="postcategory"),
            nullable=False,
        ),
        sa.Column("author_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "responses",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("post_id", sa.Integer(), sa.ForeignKey("posts.id"), nullable=False),
        sa.Column("author_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "ratings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("response_id", sa.Integer(), sa.ForeignKey("responses.id"), unique=True, nullable=False),
        sa.Column("rated_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "tips",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("currency", sa.String(10), default="USD"),
        sa.Column("paypal_order_id", sa.String(255), nullable=False),
        sa.Column("paypal_status", sa.String(50), nullable=False),
        sa.Column("sender_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("receiver_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("response_id", sa.Integer(), sa.ForeignKey("responses.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("tips")
    op.drop_table("ratings")
    op.drop_table("responses")
    op.drop_table("posts")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("DROP TYPE IF EXISTS postcategory")
