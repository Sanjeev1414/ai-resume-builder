# AI Resume Builder

A full-stack career toolkit: analyze your resume against any job post, pass ATS filters, generate cover letters,
practise interview questions, build an ATS-friendly resume and track your job applications.

**Live demo:** https://sanjeev1414.github.io/ai-resume-builder/
**API:** https://ai-resume-builder-api-o7gk.onrender.com/api/health

| Feature | What it does |
|---|---|
| Resume Analyzer (AI) | Upload a PDF + job post → match score, **ATS score**, ATS issues, missing keywords, rewritten bullets |
| Cover Letter (AI) | Tailored letter in 3 tones - edit, copy, download, saved per user |
| Interview Prep (AI) | 10-12 technical / behavioral / HR questions with tips and STAR sample answers |
| Resume Builder | Form + live ATS-friendly preview, auto-saved, download as PDF |
| Job Tracker | Wishlist → Applied → Interview → Offer / Rejected board |
| Accounts | Sign up / sign in (JWT), change password, forgot-password email link, BCrypt-hashed passwords |

---

## Tech stack

| Part | Folder | Tech |
|---|---|---|
| Frontend | [`AIweb/`](AIweb) | React 18, React Router 6, Vite |
| Backend | [`AIAPI/`](AIAPI) | Java 17, Spring Boot 3.3, Spring Security (JWT), Spring Data JPA, Java Mail |
| AI | - | OpenAI API (`gpt-5-mini`, structured JSON outputs) |
| Database | [`database/`](database) | H2 (local default), MySQL 8, PostgreSQL (production) |
| Hosting | - | GitHub Pages (frontend), Render (backend + PostgreSQL) |

```
ai-resume-builder/
├── AIweb/                  React frontend
├── AIAPI/                  Spring Boot backend (REST API)
├── database/
│   ├── schema.sql              MySQL: creates database, app user and all tables
│   └── schema-postgresql.sql   PostgreSQL version of the same tables
├── .github/workflows/      CI: frontend deploy to GitHub Pages, backend tests
├── render.yaml             One-click backend + database deploy on Render
└── docker-compose.yml      Run everything locally with Docker (MySQL + API + web)
```

```
Browser ──▶ AIweb (GitHub Pages) ──JWT──▶ AIAPI (Render) ──▶ OpenAI API
                                              │
                                              ├──▶ PostgreSQL / MySQL
                                              └──▶ SMTP email (reports, reset links)
```

---

## 1. Run it locally

**You need:** Java 17+, Maven 3.9+, Node.js 18+, and an OpenAI API key with credit
(https://platform.openai.com/api-keys - billing at https://platform.openai.com/settings/organization/billing).

### Backend (AIAPI)

```bash
cd AIAPI
cp .env.example .env        # Windows: copy .env.example .env
```
Open `AIAPI/.env` and fill in:
```properties
OPENAI_API_KEY=sk-...
JWT_SECRET=any-random-text-at-least-32-characters-long
# optional - Gmail address + app password to send emails
MAIL_USERNAME=
MAIL_PASSWORD=
```
Then start it:
```bash
mvn spring-boot:run
```
API runs at http://localhost:8080 - check http://localhost:8080/api/health

By default it uses an **H2 file database** in `AIAPI/data/` - nothing to install.

### Frontend (AIweb)

In a second terminal:
```bash
cd AIweb
npm install
npm run dev
```
Opens http://localhost:5173 - create an account and start.

---

## 2. Database setup (MySQL or PostgreSQL)

The backend creates its tables automatically. If you prefer to create the database yourself (or a DBA does),
use the ready-made scripts:

### MySQL
```bash
mysql -u root -p < database/schema.sql
```
This creates the `resume_analyzer` database, an app user `resume_app` (**edit the password in the file first**)
and all 7 tables. Then add to `AIAPI/.env`:
```properties
SPRING_PROFILES_ACTIVE=mysql
DB_USERNAME=resume_app
DB_PASSWORD=the-password-you-set
```

### PostgreSQL
```bash
# as the postgres superuser (local PostgreSQL only):
#   CREATE USER resume_app WITH PASSWORD 'your-password';
#   CREATE DATABASE resume_analyzer OWNER resume_app;
psql -h localhost -U resume_app -d resume_analyzer -f database/schema-postgresql.sql
```
Then:
```properties
SPRING_PROFILES_ACTIVE=postgres
DB_HOST=localhost
DB_NAME=resume_analyzer
DB_USERNAME=resume_app
DB_PASSWORD=your-password
```

### Tables

| Table | Holds |
|---|---|
| `users` | Accounts (name, email, BCrypt password hash) |
| `password_reset_tokens` | One-time reset links (SHA-256 hashed, 30-min expiry) |
| `analyses` | Resume analyses (score + full AI report as JSON) |
| `cover_letters` | Generated / edited cover letters |
| `interview_preps` | Interview question sets (JSON) |
| `job_applications` | Job tracker entries |
| `resume_documents` | Resume Builder drafts (one per user, JSON) |

Every table links to `users` with `ON DELETE CASCADE`.

---

## 3. Deploy

### Backend + database → Render (free)

1. Sign in at https://render.com with GitHub.
2. **New +** → **Blueprint** → select this repository. Render reads [`render.yaml`](render.yaml) and creates:
   - `ai-resume-builder-api` - the Spring Boot API (built from `AIAPI/Dockerfile`)
   - `ai-resume-builder-db` - a PostgreSQL database (tables are created on first start)
3. When asked, paste your **OPENAI_API_KEY** (and optionally `MAIL_USERNAME` / `MAIL_PASSWORD`). `JWT_SECRET` is generated for you.
4. Click **Apply**. The first build takes ~5-10 minutes.
5. Check `https://ai-resume-builder-api-o7gk.onrender.com/api/health` → `{"status":"ok"}`.

If Render gives the service a different URL, update `CORS_ALLOWED_ORIGINS`/`FRONTEND_URL` there if needed,
and set the GitHub repository variable `API_URL` (next section).

> Free tier notes: the API sleeps after 15 minutes without traffic (first request then takes ~1 minute),
> and the free PostgreSQL database expires after 30 days unless upgraded.

### Frontend → GitHub Pages (free)

1. Repository **Settings → Pages → Source: GitHub Actions**.
2. (Only if your Render URL differs) **Settings → Secrets and variables → Actions → Variables** → add `API_URL` = your Render URL.
3. Push to `main` (or **Actions → Deploy frontend → Run workflow**).
4. Site: `https://sanjeev1414.github.io/ai-resume-builder/`

### Everything with Docker (optional)
```bash
cp .env.example .env    # fill in the values
docker compose up --build
```
Open http://localhost:3000 (MySQL + API + web).

---

## 4. Tests

```bash
cd AIAPI
mvn test
```
22 tests: sign-up/sign-in, password hashing, change/forgot/reset password, rate limiting, protected endpoints,
per-user data isolation, upload validation, CORS, OpenAI request/response handling, cover letters,
interview prep, job tracker and resume builder. OpenAI and email are mocked - no keys needed.
They also run automatically on GitHub for every push.

---

## 5. Configuration reference

| Variable | Default | Meaning |
|---|---|---|
| `OPENAI_API_KEY` | - | OpenAI key (required for AI features) |
| `JWT_SECRET` | random per run | Signs login tokens - 32+ characters |
| `SPRING_PROFILES_ACTIVE` | (H2) | `mysql` or `postgres` |
| `DB_HOST` / `DB_PORT` / `DB_NAME` | - | Database location (postgres profile) |
| `DB_USERNAME` / `DB_PASSWORD` | - | Database login |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | - | Gmail + app password; empty = email off |
| `FRONTEND_URL` | `http://localhost:5173` | Used in password-reset links |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Frontend origin(s) allowed to call the API |
| `PORT` | `8080` | Port the API listens on (set by Render) |
| `VITE_API_URL` (frontend build) | same origin | Backend URL for the deployed frontend |

## 6. API overview

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | Create account / sign in → JWT |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/change-password`, `/forgot-password`, `/reset-password` | Password management |
| POST | `/api/analyze` | Analyze resume (multipart: `resume`, `jobDescription`) |
| GET | `/api/analyses`, `/api/analyses/{id}` | Analysis history |
| POST/GET/PUT/DELETE | `/api/cover-letters[/{id}]` | Cover letters |
| POST/GET/DELETE | `/api/interview-prep[/{id}]` | Interview prep |
| GET/POST/PUT/DELETE | `/api/applications[/{id}]` | Job tracker |
| GET/PUT | `/api/resume-builder` | Resume Builder draft |
| GET | `/api/health` | Health check |

All endpoints except sign-up, sign-in, password reset and health need `Authorization: Bearer <token>`.
Errors are always `{ "error": "message" }`.

---

## Security

- Passwords: BCrypt hashes only. Reset tokens: SHA-256 hashes, single use, 30-minute expiry.
- Changing or resetting a password signs out all other sessions.
- Rate limits on sign-in, sign-up, password reset and every AI feature.
- Users can only access their own data; uploads are checked by file signature.
- Secrets come from environment variables / `.env` (git-ignored) - never from code.

Built by **Sanjeev Nandihalli**.
