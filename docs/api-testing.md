# SchemeSetu API Testing

Default local services:

- Express backend: `http://localhost:5000`
- FastAPI ML service: `http://localhost:8000`
- React frontend: `http://localhost:5173`

## Backend Health

```bash
curl http://localhost:5000/
curl http://localhost:5000/api/health
```

## Schemes

```bash
curl http://localhost:5000/api/schemes
curl http://localhost:5000/api/schemes/pm-kisan
```

## Recommendation

```bash
curl -X POST http://localhost:5000/api/recommend ^
  -H "Content-Type: application/json" ^
  -d "{\"age\":21,\"gender\":\"male\",\"state\":\"Maharashtra\",\"district\":\"Nagpur\",\"caste\":\"OBC\",\"annual_income\":120000,\"occupation\":\"student\",\"disability_status\":\"no\",\"farmer_status\":\"no\",\"bpl_status\":\"yes\",\"ration_card_type\":\"yellow\",\"education_level\":\"undergraduate\"}"
```

## Rule Extraction Through Express

```bash
curl -X POST http://localhost:5000/api/extract-rules ^
  -H "Content-Type: application/json" ^
  -d "{\"text\":\"Applicant age should be between 18 and 60 years. Annual income should not exceed Rs. 2 lakh.\"}"
```

## OCR Document Verification

```bash
curl -X POST http://localhost:5000/api/ocr/verify-document ^
  -F "document=@sample.jpg" ^
  -F "citizenProfile={\"name\":\"Jatin Lanjewar\",\"annual_income\":120000,\"caste\":\"OBC\",\"disability_status\":\"no\",\"farmer_status\":\"yes\",\"land_area\":2.5}"
```

## Analytics

```bash
curl http://localhost:5000/api/analytics/dashboard
curl -X DELETE http://localhost:5000/api/analytics/reset
```

## FastAPI ML Health

```bash
curl http://localhost:8000/
curl http://localhost:8000/health
```

## FastAPI ML Recommendation

```bash
curl -X POST http://localhost:8000/recommend ^
  -H "Content-Type: application/json" ^
  -d "{\"citizen_profile\":{\"age\":21,\"gender\":\"male\",\"state\":\"Maharashtra\",\"district\":\"Nagpur\",\"caste\":\"OBC\",\"annual_income\":120000,\"occupation\":\"student\",\"disability_status\":\"no\",\"farmer_status\":\"no\",\"bpl_status\":\"yes\",\"ration_card_type\":\"yellow\",\"education_level\":\"undergraduate\"},\"schemes\":[{\"scheme_id\":\"test_scheme\",\"scheme_name\":\"OBC Student Scholarship\",\"category\":\"Education\",\"benefits\":\"Financial support for OBC students\",\"eligibility\":\"OBC students with annual income below 2.5 lakh are eligible.\",\"tags\":[\"student\",\"obc\",\"scholarship\",\"education\"]}]}"
```

## FastAPI Rule Extraction

```bash
curl -X POST http://localhost:8000/extract-rules ^
  -H "Content-Type: application/json" ^
  -d "{\"text\":\"Applicant age should be between 18 and 60 years. Annual income should not exceed Rs. 2 lakh.\"}"
```

## Port Debugging In PowerShell

```powershell
Get-NetTCPConnection -LocalPort 5000 | Select-Object LocalAddress,LocalPort,State,OwningProcess
Stop-Process -Id <OwningProcess> -Force
```
