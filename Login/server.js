require('dotenv').config();

const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;



const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  ...(process.env.FRONTEND_URL || "")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean)
];


 app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin
    if (!origin) {
      return callback(null, true);
    }

    // Allow local development
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow your Vercel frontend in production
    if (
      process.env.FRONTEND_URL &&
      origin === process.env.FRONTEND_URL
    ) {
      return callback(null, true);
    }

    console.log("Blocked CORS origin:", origin);
    callback(new Error("Origin not allowed by CORS."));
  }
}));
app.use(express.json());

function requireEnv(name) {
  if (!process.env[name]) throw new Error(`Missing environment variable: ${name}`);
  return process.env[name];
}

// Firebase Admin verifies ID tokens sent by the Vercel frontend.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: requireEnv('FIREBASE_PROJECT_ID'),
      clientEmail: requireEnv('FIREBASE_CLIENT_EMAIL'),
      privateKey: requireEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n')
    })
  });
}

const supabase = createClient(
  requireEnv('SUPABASE_URL'),
  requireEnv('SUPABASE_SECRET_KEY')
);

async function requireFirebaseUser(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing Firebase ID token.' });
    }

    const idToken = header.slice(7);
    req.firebaseUser = await admin.auth().verifyIdToken(idToken);
    next();
  } catch (error) {
    console.error('Firebase token verification failed:', error.message);
    return res.status(401).json({ message: 'Invalid or expired Firebase session.' });
  }
}

app.get('/api/health', async (req, res) => {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    res.json({ message: 'Railway backend and Supabase database are connected.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database connection failed.' });
  }
});

// Create/update the application profile after Firebase signup/login.
app.post('/api/users/sync', requireFirebaseUser, async (req, res) => {
  try {
    const firebaseUid = req.firebaseUser.uid;
    const email = (req.firebaseUser.email || req.body.email || '').trim().toLowerCase();
    const name = (req.body.name || req.firebaseUser.name || 'User').trim();

    if (!email) {
      return res.status(400).json({ message: 'Firebase account has no email address.' });
    }

    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          firebase_uid: firebaseUid,
          name,
          email
        },
        { onConflict: 'firebase_uid' }
      )
      .select('id, firebase_uid, name, email, created_at')
      .single();

    if (error) throw error;

    res.json({
      message: 'User profile saved.',
      user: data
    });
  } catch (error) {
    console.error('User sync failed:', error);
    res.status(500).json({ message: 'Could not save user profile.' });
  }
});

app.use(express.static(require('path').join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
