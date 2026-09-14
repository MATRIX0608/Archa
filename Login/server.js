require('dotenv').config();

const { GoogleGenAI } = require('@google/genai');
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;


// =====================================================
// CORS
// =====================================================

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

    // Allow requests without an origin
    if (!origin) {
      return callback(null, true);
    }

    // Allow local development
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow Vercel frontend
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


// =====================================================
// JSON BODY
// IMPORTANT: Must come BEFORE /api/scan
// =====================================================

app.use(express.json({
  limit: '15mb'
}));


// =====================================================
// ENVIRONMENT HELPER
// =====================================================

function requireEnv(name) {

  if (!process.env[name]) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return process.env[name];
}


// =====================================================
// GEMINI
// =====================================================

const gemini = new GoogleGenAI({
  apiKey: requireEnv('GEMINI_API_KEY')
});


// =====================================================
// FIREBASE ADMIN
// =====================================================

if (!admin.apps.length) {

  admin.initializeApp({
    credential: admin.credential.cert({

      projectId: requireEnv('FIREBASE_PROJECT_ID'),

      clientEmail: requireEnv('FIREBASE_CLIENT_EMAIL'),

      privateKey: requireEnv('FIREBASE_PRIVATE_KEY')
        .replace(/\\n/g, '\n')
    })
  });

}


// =====================================================
// SUPABASE
// =====================================================

const supabase = createClient(
  requireEnv('SUPABASE_URL'),
  requireEnv('SUPABASE_SECRET_KEY')
);


// =====================================================
// GEMINI IMAGE SCAN
// =====================================================

app.post('/api/scan', async (req, res) => {

  try {

    const { image, mimeType } = req.body;


    // Check image
    if (!image || !mimeType) {

      return res.status(400).json({
        message: 'Image or mimeType missing.'
      });

    }


    console.log('');
    console.log('======================================');
    console.log('Gemini scan request received');
    console.log('Image size:', image.length);
    console.log('Mime type:', mimeType);
    console.log('======================================');


    // =================================================
    // FIXED PROMPT
    // =================================================

    const prompt = `
You are an expert in Indian heritage, history, culture,
monuments, architecture, art, crafts, textiles and food.

Analyze the provided image carefully.

Identify the MAIN object shown in the image.

The object may be:
- Monument
- Historical building
- Temple
- Fort
- Sculpture
- Artwork
- Textile
- Handicraft
- Traditional food
- Cultural object
- Other Indian heritage item

Return ONLY valid JSON.

Use EXACTLY these fields:

{
  "name": "",
  "fromState": "",
  "about": "",
  "whyImportant": "",
  "whatItRepresents": "",
  "category": "",
  "place": "",
  "period": ""
}

Rules:

1. Identify the item as accurately as possible.
2. Do not invent information.
3. If you are not confident about a field, use "Unknown".
4. Keep every answer concise and easy to understand.
5. "name" = commonly known name of the item.
6. "fromState" = Indian state or union territory associated with it.
7. "about" = short explanation of what it is.
8. "whyImportant" = why it is historically or culturally important.
9. "whatItRepresents" = its cultural or historical meaning.
10. "category" = Monument, Architecture, Food, Textile, Craft,
    Sculpture, Artwork, Cultural Object, etc.
11. "place" = important city/location where it is found or associated.
12. "period" = historical period, date or approximate era.
13. Do not add extra JSON fields.
14. Do not use Markdown.
`;


    // =================================================
    // SEND IMAGE TO GEMINI
    // =================================================

    let response;

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    console.log(`Gemini attempt ${attempt}/3`);

    response = await gemini.models.generateContent({
      model: 'gemini-3.6-flash',

      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: image
          }
        },
        {
          text: prompt
        }
      ],

      config: {
        responseMimeType: 'application/json'
      }
    });

    break;

  } catch (error) {

    console.error(
      `Gemini attempt ${attempt} failed:`,
      error.message
    );

    // Retry temporary 503/429/5xx errors
    if (
      attempt < 3 &&
      (
        error.status === 503 ||
        error.status === 429 ||
        (error.status >= 500 && error.status < 600)
      )
    ) {
      const delay = attempt * 2000;

      console.log(
        `Retrying Gemini in ${delay / 1000} seconds...`
      );

      await new Promise(resolve =>
        setTimeout(resolve, delay)
      );

    } else {
      throw error;
    }
  }
}


    console.log('Gemini response received');


    // =================================================
    // GET RESPONSE TEXT
    // =================================================

    let text = response.text;


    console.log('Gemini raw response:');
    console.log(text);


    if (!text) {

      throw new Error(
        'Gemini returned an empty response.'
      );

    }


    // =================================================
    // CLEAN JSON
    // =================================================

    text = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();


    // =================================================
    // PARSE JSON
    // =================================================

    const result = JSON.parse(text);


    // =================================================
    // SEND RESULT TO FRONTEND
    // =================================================

    console.log('Identification result:', result);

    res.json(result);


  } catch (error) {

    console.error('');
    console.error('======================================');
    console.error('GEMINI SCAN ERROR');
    console.error('======================================');
    console.error(error);
    console.error('======================================');


    res.status(500).json({

      message:
        error.message ||
        'Gemini analysis failed.'

    });

  }

});


// =====================================================
// FIREBASE USER AUTH
// =====================================================

async function requireFirebaseUser(req, res, next) {

  try {

    const header =
      req.headers.authorization || '';


    if (!header.startsWith('Bearer ')) {

      return res.status(401).json({
        message: 'Missing Firebase ID token.'
      });

    }


    const idToken =
      header.slice(7);


    req.firebaseUser =
      await admin.auth().verifyIdToken(idToken);


    next();


  } catch (error) {

    console.error(
      'Firebase token verification failed:',
      error.message
    );


    return res.status(401).json({
      message:
        'Invalid or expired Firebase session.'
    });

  }

}


// =====================================================
// HEALTH CHECK
// =====================================================

app.get('/api/health', async (req, res) => {

  try {

    const { error } =
      await supabase
        .from('users')
        .select('id')
        .limit(1);


    if (error) {
      throw error;
    }


    res.json({

      message:
        'Railway backend and Supabase database are connected.'

    });


  } catch (error) {

    console.error(error);


    res.status(500).json({

      message:
        'Database connection failed.'

    });

  }

});


// =====================================================
// USER SYNC
// =====================================================

app.post(
  '/api/users/sync',
  requireFirebaseUser,
  async (req, res) => {

    try {

      const firebaseUid =
        req.firebaseUser.uid;


      const email =
        (
          req.firebaseUser.email ||
          req.body.email ||
          ''
        )
          .trim()
          .toLowerCase();


      const name =
        (
          req.body.name ||
          req.firebaseUser.name ||
          'User'
        )
          .trim();


      if (!email) {

        return res.status(400).json({

          message:
            'Firebase account has no email address.'

        });

      }


      const { data, error } =
        await supabase
          .from('users')
          .upsert(

            {
              firebase_uid: firebaseUid,
              name: name,
              email: email
            },

            {
              onConflict: 'firebase_uid'
            }

          )
          .select(
            'id, firebase_uid, name, email, created_at'
          )
          .single();


      if (error) {
        throw error;
      }


      res.json({

        message:
          'User profile saved.',

        user: data

      });


    } catch (error) {

      console.error(
        'User sync failed:',
        error
      );


      res.status(500).json({

        message:
          'Could not save user profile.'

      });

    }

  }
);


// =====================================================
// STATIC FRONTEND
// =====================================================

app.use(
  express.static(
    path.join(__dirname, 'public')
  )
);


// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {

  console.log('');
  console.log('======================================');
  console.log(`Backend server running on port ${PORT}`);
  console.log('Gemini Vision scan: ENABLED');
  console.log('======================================');
  console.log('');

});