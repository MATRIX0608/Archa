HIDDEN INDIA AUTH BACKEND

Architecture
------------
Vercel frontend -> Firebase Authentication
Vercel frontend -> Railway backend (Firebase ID token)
Railway backend -> Supabase PostgreSQL

Files
-----
server.js             Express + Firebase Admin + Supabase backend
package.json          Railway/Node dependencies
.env.example          Environment variable template
schema.sql            Fresh Supabase table definition
supabase-migration.sql Adds constraints to the users table you already created
public/login.html     Login/signup/reset UI
public/login.css      Styles
public/login.js       Firebase auth + backend sync
public/config.js      Backend URL used by the frontend

LOCAL TEST
----------
1. Copy .env.example to .env and fill in the values.
2. Run: npm install
3. Run: npm start
4. Open: http://localhost:3000/login.html

RAILWAY ENVIRONMENT VARIABLES
-----------------------------
PORT is supplied by Railway; you can leave it unset.
FRONTEND_URL=https://YOUR-VERCEL-APP.vercel.app
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=your Supabase secret key
FIREBASE_PROJECT_ID=hidden-india-login
FIREBASE_CLIENT_EMAIL=the client_email from your Firebase service-account JSON
FIREBASE_PRIVATE_KEY=the private_key from your Firebase service-account JSON, with literal \n sequences if needed

VERCEL
------
Before deploying the frontend, edit public/config.js:
window.BACKEND_URL = 'https://YOUR-RAILWAY-APP.up.railway.app';

IMPORTANT SECURITY
------------------
- Never put SUPABASE_SECRET_KEY in frontend files.
- Never commit .env or the Firebase service-account JSON file.
- The Firebase web config in login.js is intended for browser use.
- Firebase handles passwords and password-reset emails.
- Supabase stores the application profile, not the user's password.

PASSWORD RESET
--------------
The UI now uses Firebase's password-reset email link. There is no custom 6-digit OTP screen.
