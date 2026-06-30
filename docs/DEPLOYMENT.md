# SchemeSetu Deployment Guide

SchemeSetu should be deployed as separate services:

- Frontend: Vercel
- Backend: Render or Railway
- ML service: Render or Railway
- Database: MongoDB Atlas

## Backend Environment Variables

```text
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://lanjewarjatin18_db_user:<db_password>@cluster0.qjvabla.mongodb.net/?appName=Cluster0
JWT_SECRET=schemesetu_super_secure_jwt_secret_2026_jatin_938475982374
ML_SERVICE_URL=https://your-ml-service.example.com
FRONTEND_URL=https://your-frontend.example.com
```

Production backend refuses to start if `MONGO_URI` is missing.

## Frontend Environment Variables

```text
VITE_API_BASE_URL=https://your-backend.example.com/api
```

## ML Service

Install requirements:

```powershell
pip install -r requirements.txt
```

Run:

```powershell
uvicorn app:app --host 0.0.0.0 --port 8000
```

## Data Migration

After backend environment variables are configured:

```powershell
node server/scripts/migrateSchemesToMongo.js
```

Only verified and active schemes are used for public recommendations.

## Production Checklist

- Configure MongoDB Atlas IP/network access.
- Set strong `JWT_SECRET`.
- Set exact `FRONTEND_URL` for CORS.
- Register first admin account.
- Migrate existing schemes.
- Verify imported schemes before public use.
- Confirm OCR upload size limits.
- Confirm ML `/health` endpoint.
- Run frontend build.
- Run backend and API tests.

## Honest Product Positioning

Use this wording:

```text
SchemeSetu is a citizen assistance platform for scheme eligibility support.
```

Do not claim:

```text
All government schemes are already included.
```
