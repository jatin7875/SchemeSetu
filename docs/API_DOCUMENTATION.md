# SchemeSetu API Documentation

Base URL:

```text
http://localhost:5000/api
```

All error responses use:

```json
{
  "success": false,
  "message": "Readable error message"
}
```

## Auth APIs

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/auth/admin/register` | Create an admin or reviewer account. First account becomes admin. |
| POST | `/auth/admin/login` | Login and receive JWT token. |
| GET | `/auth/me` | Return current admin user. Requires token. |
| POST | `/auth/logout` | Clear auth cookie and end local session. |

Login request:

```json
{
  "email": "admin@example.com",
  "password": "strongpassword"
}
```

## Scheme APIs

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/schemes` | Return paginated public schemes where `status=active` and `verification_status=verified`. |
| GET | `/schemes/:id` | Return scheme by MongoDB id, `scheme_id`, or slug. |

Supported query filters:

```text
category, state, scheme_level, status, search, page, limit
```

Response:

```json
{
  "success": true,
  "schemes": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "pages": 0
  }
}
```

## Admin Scheme APIs

All routes require `Authorization: Bearer <token>`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/admin/schemes` | List schemes for admin review. |
| POST | `/admin/schemes` | Create scheme as draft or needs review. |
| PUT | `/admin/schemes/:id` | Update scheme. |
| DELETE | `/admin/schemes/:id` | Soft delete by closing/rejecting scheme. |
| PATCH | `/admin/schemes/:id/verify` | Mark scheme as verified, outdated, rejected, draft, or needs review. |

## Recommendation APIs

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/recommend` | Save citizen profile, evaluate verified schemes, call ML service, store recommendation, and log analytics. |

Request:

```json
{
  "age": 22,
  "gender": "female",
  "state": "Maharashtra",
  "district": "Nagpur",
  "caste": "OBC",
  "annual_income": 120000,
  "occupation": "student"
}
```

Response includes `recommendations`, `citizen_profile_id`, `recommendation_id`, and a message if ML ranking is unavailable.

## OCR APIs

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/ocr/verify-document` | Upload JPG/JPEG/PNG certificate image and compare OCR values with profile. |

Multipart fields:

- `document`
- `citizenProfile`
- `documentType`

The backend deletes uploaded files after OCR and stores only verification summary in MongoDB when available.

## Analytics APIs

All routes require admin authentication.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/analytics/dashboard` | Dashboard summary and chart datasets. |
| GET | `/analytics/recent` | Recent recommendation activity. |
| GET | `/analytics/state-wise` | State-wise application counts. |
| GET | `/analytics/income-groups` | Income group counts. |
| DELETE | `/analytics/reset` | Clear analytics events. |

## Import APIs

All routes require admin authentication.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/import/schemes/json` | Import JSON scheme file as needs-review records. |
| POST | `/import/schemes/csv` | Import CSV scheme file as needs-review records. |
| GET | `/import/jobs` | List import jobs. |
| GET | `/import/jobs/:id` | Get one import job. |

## ML APIs

FastAPI service base URL:

```text
http://localhost:8000
```

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | Return service and model status. |
| POST | `/recommend` | Rank schemes with semantic/model scoring. |
| POST | `/extract-rules` | Extract structured rules from eligibility text. |
