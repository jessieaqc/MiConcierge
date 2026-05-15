from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.session import engine, Base
from routes import auth, users, posts, responses, ratings, payments

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Mi Concierge API",
    description="API para conectar turistas con locales reales",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(posts.router, prefix="/posts", tags=["Posts"])
app.include_router(responses.router, prefix="/responses", tags=["Responses"])
app.include_router(ratings.router, prefix="/ratings", tags=["Ratings"])
app.include_router(payments.router, prefix="/payments", tags=["Payments"])


@app.get("/")
def root():
    return {"message": "Mi Concierge API running"}
