https://archa-blue.vercel.app/

# Deployment & Backend Setup

## 1. Project Deployment

The project uses the following services:

| Component      | Platform                |
| -------------- | ----------------------- |
| Frontend       | Vercel                  |
| Backend        | Railway                 |
| Database       | Supabase PostgreSQL     |
| Authentication | Firebase Authentication |

### Architecture

```text
Frontend (Vercel)
       │
       ▼
Backend (Railway)
       │
       ├── Firebase Authentication
       │
       ▼
Supabase PostgreSQL
```

---

# 2. Backend Environment Variables

The backend requires the following environment variables.

Create a `.env` file in the backend project:

```env
FRONTEND_URL=https://your-frontend.vercel.app

SUPABASE_URL=your_supabase_url
SUPABASE_SECRET_KEY=your_supabase_secret_key

FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key

GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

GEMINI_API_KEY1=your_gemini_api_key_1
GEMINI_API_KEY2=your_gemini_api_key_2
GEMINI_API_KEY3=your_gemini_api_key_3
GEMINI_API_KEY4=your_gemini_api_key_4
```

> **Important:** Never commit `.env` files or API keys to GitHub. Add `.env` to `.gitignore`.

---

# 3. Railway Backend Setup

Deploy the backend to **Railway**.

After deployment, Railway will provide a backend URL similar to:

```text
https://your-backend.up.railway.app
```

This URL is required by the frontend whenever it communicates with the backend.

Add the required environment variables in:

```text
Railway
 → Project
 → Backend Service
 → Variables
```

Use the same variable names as those listed in the `.env` section.

---

# 4. Vercel Frontend Setup

Deploy the frontend to **Vercel**.

The frontend will have a URL similar to:

```text
https://your-project.vercel.app
```

This URL must be used as the value of:

```env
FRONTEND_URL=https://your-project.vercel.app
```

The exact Vercel URL should be used instead of the example above.

---

# 5. Frontend Backend URL Configuration

After deploying the backend, update the backend URL in the following files.

## AI Chatbot

```text
Ai-Chatbot/
└── ai-guide.js
```

Put the Railway backend URL wherever the backend API URL is defined.

Example:

```javascript
const BACKEND_URL = "https://your-backend.up.railway.app";
```

---

## Scan

```text
Scan/
└── scan.js
```

Update the backend URL in this file as well.

Example:

```javascript
const BACKEND_URL = "https://your-backend.up.railway.app";
```

---

## Homepage

```text
Homepage/
└── script.js
```

Only modify this file if the homepage makes requests to the backend.

If it does not communicate with the backend, no change is required.

---

# 6. Required Files to Check

Before deployment, check the following files:

```text
Ai-Chatbot/
└── ai-guide.js
    └── Backend URL

Scan/
└── scan.js
    └── Backend URL

Homepage/
└── script.js
    └── Backend URL (only if required)
```

The main purpose is to ensure that no local development URL such as:

```text
http://localhost:3000
```

remains in the production frontend.

Replace it with the Railway backend URL.

---

# 7. Supabase Database Setup

Create a PostgreSQL table named:

```text
users
```

The table should contain the following columns:

| Column         | Type          | Default                   | Primary Key |
| -------------- | ------------- | ------------------------- | ----------- |
| `id`           | `int8`        | Identity / auto-generated | ✅           |
| `firebase_uid` | `text`        | —                         | ❌           |
| `name`         | `text`        | —                         | ❌           |
| `email`        | `text`        | —                         | ❌           |
| `created_at`   | `timestamptz` | `now()`                   | ❌           |

sql qurey edit - create unique index if not exists users_firebase_uid_key on public.users (firebase_uid);

### Column Details

**id**

Automatically generated unique database ID.

**firebase_uid**

Stores the user's Firebase Authentication UID.

**name**

Stores the user's name.

**email**

Stores the user's email address.

**created_at**

Stores the date and time when the user record was created.

---

# 8. Firebase UID Unique Constraint

Each Firebase user should have only one corresponding record in the database.

Run the following SQL query in Supabase SQL Editor:

```sql
create unique index if not exists users_firebase_uid_key
on public.users (firebase_uid);
```

This ensures that duplicate Firebase UIDs cannot be inserted into the `users` table.

---

# 9. Authentication Architecture

The authentication system uses **Firebase Authentication**.

Firebase handles:

* User signup
* User login
* Password reset
* Authentication credentials

After successful authentication, Firebase provides an **ID Token**.

The frontend sends this token to the Node.js/Express backend.

The backend verifies the token before processing authenticated requests.

---

# 10. Complete Authentication Flow

```text
                 ┌──────────────┐
                 │  Login Page  │
                 └──────┬───────┘
                        │
                        ▼
              ┌───────────────────┐
              │   Firebase Auth   │
              │                   │
              │ Signup / Login    │
              │ Password Reset    │
              └─────────┬─────────┘
                        │
                     ID Token
                        │
                        ▼
              ┌───────────────────┐
              │  Node + Express   │
              │ Backend :3000     │
              │                   │
              │ Token Verification│
              └─────────┬─────────┘
                        │
                        ▼
              ┌───────────────────┐
              │     Supabase      │
              │    PostgreSQL     │
              │                   │
              │    users table    │
              └───────────────────┘
```

### Production Version

During development, the backend may run on:

```text
http://localhost:3000
```

After deployment:

```text
Frontend → Vercel
Backend  → Railway
Database → Supabase
Auth     → Firebase
```

The production frontend should communicate with the Railway backend rather than `localhost`.

---

# 11. Final Deployment Checklist

Before submitting or deploying the project, verify:

### Backend

* [ ] Backend deployed on Railway
* [ ] All required environment variables added
* [ ] Supabase URL configured
* [ ] Supabase secret key configured
* [ ] Firebase credentials configured
* [ ] Gemini API keys configured
* [ ] Groq API key configured
* [ ] OpenRouter API key configured
* [ ] CORS configured for the Vercel frontend

### Database

* [ ] Supabase project created
* [ ] `users` table created
* [ ] `firebase_uid` configured
* [ ] Unique index created
* [ ] `created_at` default set to `now()`

### Frontend

* [ ] Vercel deployment completed
* [ ] `ai-guide.js` checked
* [ ] `scan.js` checked
* [ ] `script.js` checked if it uses backend APIs
* [ ] No production API calls point to `localhost`
* [ ] Railway backend URL configured

### Security

* [ ] `.env` is included in `.gitignore`
* [ ] API keys are not committed to GitHub
* [ ] Firebase private key is not exposed in frontend code
* [ ] Supabase secret key is only used on the backend
* [ ] Production CORS allows the correct Vercel domain
