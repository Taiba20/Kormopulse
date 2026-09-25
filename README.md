# Kormopulse

**Careers that move: a full-stack job and talent matching platform for the Bangladesh job market.**

Kormopulse connects job seekers and employers. Job seekers build profiles, search and apply for jobs, and track their applications. Employers publish jobs, manage applicants, and message candidates. AI-assisted features (via Groq) help write job descriptions and analyse skill gaps.

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Demo mode](#demo-mode)
- [Project structure](#project-structure)
- [API overview](#api-overview)
- [Security](#security)
- [Deployment](#deployment)

## Features

### Job seekers
- **Profile:** personal info, skills, education, work experience, social links, profile picture and resume uploads (Cloudinary).
- **Search:** filter jobs by keyword, location, company, salary range (BDT), experience, job type and work mode.
- **Apply and save:** apply to jobs, bookmark them, and track every application in a dashboard.
- **Recommendations and AI:** job recommendations and an AI skill-gap analysis against a job's requirements.
- **Messaging:** message recruiters, and receive chat requests from them.

### Employers
- **Company profile:** company details, logo, social links and multiple recruiter users.
- **Job posting:** rich-text job posts, salary ranges, deadlines, edit and archive, plus an AI job-description generator.
- **Applicants:** review applications, shortlist, reject or hire candidates, and see candidate matches for a job.
- **Messaging:** contact candidates directly.

### Platform
- JWT authentication with refresh tokens and role-based access (job seeker / employer).
- Role-specific onboarding and dashboards.
- Change-password flow and a forgot-password flow that emails a 6-digit reset code.
- Email notifications: applicants and employers are emailed when an application is submitted, and candidates are emailed when they are shortlisted or hired.
- Responsive UI built with Tailwind CSS.

## Tech stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React 19, Vite 7, Tailwind CSS 4, Redux Toolkit, React Router 7, Axios, Tremor, Heroicons, Font Awesome |
| Backend | Node.js, Express 5, MongoDB with Mongoose 8, JWT, bcryptjs, Multer, DOMPurify |
| Services | Cloudinary (media storage), Groq SDK (AI features) |
| Tooling | ESLint, npm |

## Getting started

### Prerequisites

- Node.js 18 or newer
- MongoDB (local instance or MongoDB Atlas)
- Optional: a Cloudinary account (uploads) and a Groq API key (AI features)

### Install

From the repository root:

```bash
npm run install:all
```

### Configure environment

Copy the templates and fill in your values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Backend (`backend/.env`):

| Variable | Purpose |
|----------|---------|
| `PORT` | API port (default `8000`) |
| `CORS_ORIGIN` | Comma-separated allowed origins (default `http://localhost:5173,http://localhost:5174`) |
| `COOKIE_DOMAIN` | Optional: share auth cookies across subdomains in production (leave empty otherwise) |
| `MONGODB_URL` | MongoDB connection string |
| `ACCESS_TOKEN_SECRET`, `ACCESS_TOKEN_EXPIRY` | Access token signing secret and lifetime |
| `REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRY` | Refresh token signing secret and lifetime |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Image and resume uploads |
| `GROQ_API_KEY` | AI job-description generation and skill-gap analysis |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Outgoing email (reset codes and application notifications) |

Frontend (`frontend/.env`):

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API base URL (default `http://localhost:8000/api`) |
| `VITE_APP_NAME` | Application name (default `Kormopulse`) |

### Run

In two terminals:

```bash
npm run dev:backend    # API on http://localhost:8000
npm run dev:frontend   # App on http://localhost:5173
```

Other scripts:

```bash
npm run build   # production build of the frontend
npm run lint    # lint the frontend
```

## Demo mode

If MongoDB is not reachable, the API still starts and serves the database-independent demo endpoints. Run it with:

```bash
npm run demo
```

The overview is available at `http://localhost:8000/api/demo/overview`. Database-backed routes (login, jobs, applications and so on) need MongoDB.

## Project structure

```text
Kormopulse/
├── package.json            # Workspace scripts
├── backend/
│   ├── .env.example
│   ├── public/temp/        # Temporary upload storage
│   └── src/
│       ├── app.js          # Express app and server entry
│       ├── constants.js
│       ├── controllers/    # user, job, company, message
│       ├── db/             # MongoDB connection
│       ├── middlewares/    # JWT auth, Multer uploads
│       ├── models/         # Mongoose schemas
│       ├── routes/         # user, jobs, company, message, demo
│       └── utils/          # ApiError, ApiResponse, Cloudinary, Groq
└── frontend/
    ├── .env.example
    ├── config.js           # API URL and app name
    └── src/
        ├── Pages/          # Route-level pages
        ├── Routes/         # Public and private routes
        ├── components/     # Home, JobListing, JobDetails, dashboards, profile, forms
        ├── hooks/
        ├── services/       # Axios API clients
        └── store/          # Redux store and auth slice
```

## API overview

Base URL: `http://localhost:8000/api`. Protected routes need a valid access token (cookie or `Authorization: Bearer <token>` header).

| Prefix | Examples |
|--------|----------|
| `/users` | `POST /signup`, `POST /login`, `POST /logout`, `GET /current-user`, `GET /profile`, `POST /profile-picture`, `POST /resume`, `POST /add-skill`, `GET /skill-gap/:jobId`, `POST /change-password`, `POST /forgot-password` (emails a code), `POST /reset-password` (code + new password), `GET /public-profile/:id` |
| `/jobs` | `GET /jobs`, `GET /jobs/:id`, `POST /jobs`, `GET /companies`, `POST /apply/:id`, `POST /save/:id`, `GET /saved-jobs`, `GET /my-applications`, `GET /job-recommendations`, `POST /generate-job-description`, `POST /shortlist-candidate`, `POST /reject-candidate`, `POST /hire-candidate` |
| `/company` | `GET /listings`, `GET /active-listings`, `GET /applications`, `POST /shortlist-candidate`, `GET /candidate-matches/:jobId` |
| `/messages` | `GET /`, `POST /send`, `POST /send-chat-request`, `POST /:messageId/respond`, `GET /unread-count`, `PATCH /:messageId/read`, `PATCH /mark-all-read` |
| `/demo` | `GET /overview` |

## Security

- Passwords are hashed with bcryptjs.
- Password reset codes are emailed, stored only as a hash, expire after 10 minutes, allow 5 attempts, and are single-use.
- Access and refresh tokens are signed with JWT; protected routes go through the `verifyJWT` middleware.
- User-provided HTML is sanitised with DOMPurify.
- CORS origins are restricted through `CORS_ORIGIN`.
- Secrets live in `.env` files, which are git-ignored.

## Deployment

- **Frontend:** build with `npm run build` and deploy `frontend/dist` to a static host (Vercel, Netlify). Set `VITE_API_URL` to the deployed API.
- **Backend:** deploy `backend/` to any Node.js host and set the environment variables listed above, including `CORS_ORIGIN` for the deployed frontend.
- **Database:** MongoDB Atlas is recommended.
