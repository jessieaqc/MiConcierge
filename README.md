# Mi Concierge

Mi Concierge is a platform that connects travelers with locals. Ask a question about a city and someone who lives there will answer—the way they'd answer a friend. The project consists of a FastAPI backend and a React (Vite) frontend.

---

## Project Structure

The repository is organized into two main parts:

- **Backend (Root Directory)**: A FastAPI + PostgreSQL application that handles users, posts, responses, ratings, and tip payments via PayPal.
- **Frontend (`/mi-concierge`)**: A React + Vite single-page application (SPA) styled with Tailwind CSS and Lucide React icons, acting as the mobile app interface.

---

## Backend Setup (FastAPI)

The backend code lives in the root directory.

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

## Frontend Setup (React + Vite)

The frontend code lives in the `mi-concierge` directory.

### 1. Navigate to the frontend directory
```bash
cd mi-concierge
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the development server
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.  
Make sure your backend is running concurrently on port 8000 for the app to function properly.

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

## Deployment

- **Backend**: Can be deployed on platforms like Railway, Render, or Heroku. Ensure all environment variables from `.env.example` are set.
- **Frontend**: Can be built using `npm run build` inside the `mi-concierge` directory and deployed on Vercel, Netlify, or similar static hosting platforms.
