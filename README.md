# SchemeSetu

SchemeSetu is a citizen assistance platform for government scheme discovery, eligibility support, recommendation scoring, document checking, and admin-verified scheme data management.

The production architecture supports:

- React + Vite frontend
- Express.js backend API
- MongoDB Atlas for production data
- FastAPI ML service for recommendation ranking and rule extraction
- OCR document verification with temporary uploads only
- Admin authentication, scheme review, imports, and analytics

## Run Locally

Install dependencies:

```powershell
npm run install:all
```

Run frontend and backend:

```powershell
npm run dev
```

Run ML service:

```powershell
cd ml-service
uvicorn app:app --reload --port 8000
```

## MongoDB Setup

Create `server/.env` from `server/.env.example` and set:

```text
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/schemesetu
JWT_SECRET=change_this_secret
```

Development mode can still use local JSON fallback if `MONGO_URI` is missing. Production mode refuses to start without MongoDB.

## Migrate Existing Schemes

```powershell
node server/scripts/migrateSchemesToMongo.js
```

The migration reads `data/schemes.json`, avoids duplicate `scheme_id` values, and marks curated records as `verified`.

## Important Note

SchemeSetu is a scheme eligibility support platform. It is not an official government portal and does not provide final approval. Citizens should always review the official source link before applying.
