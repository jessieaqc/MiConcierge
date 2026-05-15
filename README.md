# Mi Concierge — Backend

FastAPI + PostgreSQL backend for the Mi Concierge mobile app.

## Setup

### 1. Create a virtual environment
```bash
python -m venv venv
source venv/bin/activate      # Linux / macOS
venv\Scripts\activate         # Windows
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your database URL, JWT secret, and PayPal credentials
```

### 4. Run database migrations
```bash
alembic upgrade head
```

### 5. Start the development server
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

---

## Project Structure

```
backend/
├── main.py                  # FastAPI app entry point
├── requirements.txt
├── .env.example
├── database/
│   ├── session.py           # SQLAlchemy engine & session
│   └── migrations/
│       └── 0001_initial.py  # Alembic migration
├── models/
│   └── models.py            # SQLAlchemy ORM models
├── schemas/
│   └── schemas.py           # Pydantic request/response schemas
├── routes/
│   ├── auth.py              # POST /auth/register, /auth/login
│   ├── users.py             # GET /users/me, /users/{id}
│   ├── posts.py             # CRUD for tourist posts
│   ├── responses.py         # CRUD for local responses
│   ├── ratings.py           # Star ratings (0–5)
│   └── payments.py          # PayPal tip flow
└── utils/
    ├── jwt.py               # Token creation & verification
    └── hashing.py           # bcrypt password hashing
```

---

## API Endpoints

| Method | Path | Description | Role |
|--------|------|-------------|------|
| POST | `/auth/register` | Register a new user | Public |
| POST | `/auth/login` | Login and get JWT | Public |
| GET | `/users/me` | Get current user profile | Any |
| GET | `/users/{id}` | Get user by ID | Any |
| POST | `/posts/` | Create a post | Tourist |
| GET | `/posts/` | List posts (filter by city/category) | Any |
| GET | `/posts/{id}` | Get a post | Any |
| DELETE | `/posts/{id}` | Delete own post | Tourist |
| POST | `/responses/{post_id}` | Reply to a post | Local |
| GET | `/responses/{post_id}` | List responses for a post | Any |
| DELETE | `/responses/{id}` | Delete own response | Local |
| POST | `/ratings/` | Rate a response (0–5 stars) | Tourist |
| GET | `/ratings/{response_id}` | Get rating for a response | Any |
| POST | `/payments/tip/create-order` | Create PayPal tip order | Tourist |
| POST | `/payments/tip/capture/{order_id}` | Capture PayPal payment | Tourist |

---

## PayPal Integration

The tip flow has two steps:

1. **Create order** — `POST /payments/tip/create-order`  
   Returns a `paypal_order_id` and an approval URL. Redirect the user to PayPal for approval.

2. **Capture payment** — `POST /payments/tip/capture/{order_id}`  
   After approval, capture the payment and record the tip in the database.

Use `PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com` for development.  
Switch to `https://api-m.paypal.com` for production.

---

## Deployment (Railway / Render)

Set all environment variables from `.env.example` in your deployment dashboard.  
The `DATABASE_URL` should point to your Neon or Supabase PostgreSQL instance.
