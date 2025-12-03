# KYC Orchestrator Demo Frontend

This is a minimal, framework-free frontend that talks directly to your KYC backend:

- `POST /uploads/presign` — get a presigned URL to upload files to S3
- `PUT  <uploadUrl>`     — upload the selected file directly to S3
- `POST /jobs`           — submit a KYC job with the S3 keys as inputs
- `GET  /jobs/{jobId}`   — poll for job status & results

The API base URL is currently:

- `https://cjv956i6qf.execute-api.ap-south-1.amazonaws.com`

If your API Gateway stage changes (e.g. there is a `/dev` prefix), update `API_BASE`
at the top of `main.js`.

## Project structure

- `index.html` — UI layout
- `style.css`  — styling (dark, clean, not too fancy)
- `main.js`    — all logic (upload, submit job, poll results)

## Running locally

Any static file server will work, for example using Node:

```bash
cd kyc-frontend
npx serve .
# or: python -m http.server 8000
```

Then open:

- `http://localhost:3000` or `http://localhost:8000` (depending on the server)

> Make sure your API Gateway has **CORS enabled** for:
> - `POST /uploads/presign`
> - `POST /jobs`
> - `GET /jobs/{jobId}`

## How it works (high-level)

1. You select images, video, or audio (any combination).
2. For every file, the frontend calls `/uploads/presign` and then uploads the file using the returned `uploadUrl`.
3. It builds the `inputs` object using the `s3Key` values returned by your backend.
4. It calls `POST /jobs` with `{ userId, inputs }`.
5. It starts polling `GET /jobs/{jobId}` every 3 seconds until the job is `COMPLETED` or `FAILED`.
6. It renders a summary card and one result card per tool.

You can hand this folder as-is to your frontend friend or host it on S3, Netlify, Vercel, etc.
