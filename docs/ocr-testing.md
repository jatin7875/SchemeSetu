# OCR Document Verification Testing

## Generate Sample Test Document

```bash
node server/utils/createTestDocumentImage.js
```

Output:

```text
server/test-documents/sample-certificate.png
```

The generated image contains:

```text
GOVERNMENT OF MAHARASHTRA
INCOME AND CASTE CERTIFICATE
Applicant Name: Jatin Lanjewar
Annual Income: Rs. 120000
Caste Category: OBC
Disability Percentage: 0%
Land Area: 2.5 acre
```

## Matching Citizen Profile

```json
{
  "name": "Jatin Lanjewar",
  "annual_income": 120000,
  "caste": "OBC",
  "disability_status": "no",
  "farmer_status": "yes",
  "land_area": 2.5
}
```

Expected:

- `overall_status = verified`
- `confidence_score >= 80`
- name, income, caste and land area should match

## Mismatch Citizen Profile

```json
{
  "name": "Jatin Lanjewar",
  "annual_income": 300000,
  "caste": "SC",
  "disability_status": "yes",
  "farmer_status": "yes",
  "land_area": 5
}
```

Expected mismatches:

- Income does not match profile
- Caste does not match profile
- Disability percentage is below 40%
- Land area does not match profile

## Run Node OCR Test

```bash
node server/test-ocr.js
```

## Postman

Method:

```text
POST
```

URL:

```text
http://localhost:5000/api/ocr/verify-document
```

Body: `form-data`

| Key | Type | Value |
| --- | --- | --- |
| document | File | `server/test-documents/sample-certificate.png` |
| citizenProfile | Text | JSON citizen profile |

## curl

```bash
curl -X POST http://localhost:5000/api/ocr/verify-document \
  -F "document=@server/test-documents/sample-certificate.png" \
  -F "citizenProfile={\"name\":\"Jatin Lanjewar\",\"annual_income\":120000,\"caste\":\"OBC\",\"disability_status\":\"no\",\"farmer_status\":\"yes\",\"land_area\":2.5}"
```

## Windows PowerShell curl.exe

```powershell
curl.exe -X POST "http://localhost:5000/api/ocr/verify-document" `
  -F "document=@server/test-documents/sample-certificate.png" `
  -F "citizenProfile={\"name\":\"Jatin Lanjewar\",\"annual_income\":120000,\"caste\":\"OBC\",\"disability_status\":\"no\",\"farmer_status\":\"yes\",\"land_area\":2.5}"
```
