# Railway Deploy (Quick)

## 1) Requirements
- GitHub repo contains this project.
- MongoDB Atlas database (recommended for production persistence).

## 2) Deploy on Railway
1. Open `https://railway.app`.
2. Create new project.
3. Choose `Deploy from GitHub repo`.
4. Select this repository.

Railway will detect Node.js automatically and run:
- Install: `npm install`
- Start: `npm start`

## 3) Environment Variables (required)
In Railway project -> `Variables`, add:

- `MONGODB_URI` = your Atlas connection string
  - Example: `mongodb+srv://user:pass@cluster.mongodb.net/certificates`
- `PORT` = `3000` (optional; Railway also injects its own `PORT`)

## 4) Verify after deploy
Open:
- `https://<your-domain>/api/health`

Expected response:
```json
{"status":"ok","mongo":"connected"}
```

Then test pages:
- `https://<your-domain>/admin.html`
- `https://<your-domain>/editor.html`
- `https://<your-domain>/parents.html`

## 5) Notes
- Certificates are saved to MongoDB via `/api/certificates/save`.
- LocalStorage is used only as a browser fallback cache.
- If Mongo is disconnected, app still runs but save/list APIs return errors until DB is back.
