# TaskiFy

TaskiFy is a task management app built with React and Vite. Users must register and sign in before accessing the workspace. Tasks are stored by the backend and scoped to their authenticated owner.

## Run locally

The backend and frontend run in separate terminals.

### 1. Configure and start the backend

In the repository root:

```powershell
cd backend\backend
npm install
Copy-Item .env.example .env
```

Edit `backend\backend\.env` and set:

- `MONGO_URI` to your MongoDB connection string.
- `JWT_SECRET` to a unique random value of at least 32 bytes.
- `CLIENT_URL` to the frontend origin, normally `http://localhost:5173`.
- `PORT` to the API port, normally `4000`.

Generate a secret in the backend terminal with:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste the generated value after `JWT_SECRET=` in `.env`. Keep `.env` private and do not commit it.

Start the API:

```powershell
npm run server
```

The server waits for MongoDB before listening. Keep this terminal running.

### 2. Start the frontend

In a second terminal from the repository root:

```powershell
cd Frontend
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`. Vite proxies `/api` requests to `http://localhost:4000`. If you change the API port, update the proxy in `Frontend\vite.config.js`.

For a deployed frontend, set `VITE_API_URL` to the backend origin (for example, `https://api.example.com`, without `/api`) when building the frontend. Set the backend `CLIENT_URL` to the exact deployed frontend origin. The production session cookie is Secure and requires HTTPS.

## Authentication and task API

- `POST /api/auth/register` stores a `MEMBER` account in MongoDB but does not sign it in. Register once, then use the same email and password to sign in on later visits. If the email is already registered, the app takes the user to sign in instead of creating another account.
- `POST /api/auth/login` validates credentials and sets an HttpOnly session cookie.
- `GET /api/auth/me` restores the current session; `POST /api/auth/logout` clears it.
- Task and dashboard endpoints require a valid session. The backend sets task ownership and limits task operations and statistics to the signed-in user.
- Passwords are hashed by the backend. The frontend does not store or log passwords or JWTs.

If the browser reports a Vite `502 Bad Gateway` for an `/api` request, check that the backend is running, MongoDB connected successfully, and the backend is listening on the port configured in the Vite proxy.

## Validation

From `Frontend`:

```powershell
npm run build
npm run lint
```
