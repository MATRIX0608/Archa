require('dotenv').config();

const { GoogleGenAI } = require('@google/genai');
const Groq = require('groq-sdk');
const OpenAI = require('openai');
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
  "https://archa-blue.vercel.app",
  "http://localhost:3000"
];

app.use(cors({
  origin: function (origin, callback) {

    // Allow requests without an origin
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log('Blocked CORS origin:', origin);

    callback(new Error('Origin not allowed by CORS.'));
  }
}));


// =====================================================
// JSON BODY
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
// AI FALLBACK PROVIDERS
// =====================================================

const groq = new Groq({
  apiKey: requireEnv('GROQ_API_KEY')
});

const openrouter = new OpenAI({
  apiKey: requireEnv('OPENROUTER_API_KEY'),
  baseURL: 'https://openrouter.ai/api/v1'
});

const gemini1 = new GoogleGenAI({
  apiKey: requireEnv('GEMINI_API_KEY1')
});

const gemini2 = new GoogleGenAI({
  apiKey: requireEnv('GEMINI_API_KEY2')
});

const gemini3 = new GoogleGenAI({
  apiKey: requireEnv('GEMINI_API_KEY3')
});

const gemini4 = new GoogleGenAI({
  apiKey: requireEnv('GEMINI_API_KEY4')
});

// =====================================================
// FIREBASE ADMIN
// KEEP READY FOR LATER AUTH
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
// MULTI-PROVIDER FALLBACK
// =====================================================

app.post('/api/scan', async (req, res) => {

  try {

    const { image, mimeType } = req.body;

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!image || !mimeType) {

      return res.status(400).json({
        message: 'Image or mimeType missing.'
      });

    }

    console.log('');
    console.log('======================================');
    console.log('Heritage image scan request');
    console.log('Image size:', image.length);
    console.log('Mime type:', mimeType);
    console.log('======================================');


    // -------------------------------------------------
    // SCAN PROMPT
    // -------------------------------------------------

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
    // PROVIDER 1 — GEMINI
    // =================================================

    try {

      console.log('Trying Scan Provider 1: Gemini...');

      const response =
        await gemini.models.generateContent({

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

      let text = response.text;

      if (!text) {
        throw new Error(
          'Gemini returned an empty response.'
        );
      }

      text = text
        .replace(/^```json/i, '')
        .replace(/^```/i, '')
        .replace(/```$/i, '')
        .trim();

      const result = JSON.parse(text);

      console.log(
        '✅ Gemini scan successful.'
      );

      return res.json({
        ...result,
        provider: 'Gemini'
      });

    } catch (error) {

      console.error(
        '❌ Gemini scan failed:',
        error.message
      );

      console.log(
        'Switching to Scan Provider 2...'
      );

    }


    // =================================================
    // PROVIDER 2 — GROQ
    // =================================================

    try {

      console.log('Trying Scan Provider 2: Groq...');

      /*
       * Groq models generally do not provide image
       * understanding through the same interface here.
       *
       * Therefore Groq receives the extracted question
       * only if you later add a vision-capable Groq model.
       */

      throw new Error(
        'Groq scan fallback requires a vision-capable Groq model.'
      );

    } catch (error) {

      console.error(
        '❌ Groq scan failed:',
        error.message
      );

      console.log(
        'Switching to Scan Provider 3...'
      );

    }

    // =================================================
    // PROVIDER 3 — GEMINI
    // =================================================

    try {

      console.log('Trying Scan Provider 3: Gemini...');

      const response =
        await gemini1.models.generateContent({

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

      let text = response.text;

      if (!text) {
        throw new Error(
          'Gemini returned an empty response.'
        );
      }

      text = text
        .replace(/^```json/i, '')
        .replace(/^```/i, '')
        .replace(/```$/i, '')
        .trim();

      const result = JSON.parse(text);

      console.log(
        '✅ Gemini scan successful.'
      );

      return res.json({
        ...result,
        provider: 'Gemini'
      });

    } catch (error) {

      console.error(
        '❌ Gemini scan failed:',
        error.message
      );

      console.log(
        'Switching to Scan Provider 4...'
      );

    }



    // =================================================
    // PROVIDER 4 — OPENROUTER
    // =================================================

    try {

      console.log(
        'Trying Scan Provider 4: OpenRouter...'
      );

      const completion =
        await openrouter.chat.completions.create({

          model: 'openai/gpt-oss-20b:free',

          messages: [

            {
              role: 'user',

              content: [

                {
                  type: 'text',
                  text: prompt
                },

                {
                  type: 'image_url',

                  image_url: {
                    url:
                      `data:${mimeType};base64,${image}`
                  }

                }

              ]

            }

          ]

        });

      let text =
        completion
          .choices?.[0]
          ?.message
          ?.content;

      if (!text) {

        throw new Error(
          'OpenRouter returned an empty response.'
        );

      }

      text = text
        .replace(/^```json/i, '')
        .replace(/^```/i, '')
        .replace(/```$/i, '')
        .trim();

      const result = JSON.parse(text);

      console.log(
        '✅ OpenRouter scan successful.'
      );

      return res.json({
        ...result,
        provider: 'OpenRouter'
      });

    } catch (error) {

      console.error(
        '❌ OpenRouter scan failed:',
        error.message
      );

    }


    // =================================================
    // ALL PROVIDERS FAILED
    // =================================================

    return res.status(503).json({

      message:
        'All AI scan providers are currently unavailable. Please try again later.'

    });

  } catch (error) {

    console.error('');
    console.error('======================================');
    console.error('AI SCAN ERROR');
    console.error('======================================');
    console.error(error);
    console.error('======================================');

    return res.status(500).json({

      message:
        error.message ||
        'AI image scan failed.'

    });

  }

});

// =====================================================
// AI HERITAGE CHATBOT
// MULTI-PROVIDER FALLBACK
// =====================================================

app.post('/api/chat', async (req, res) => {

  try {

    const { question, language } = req.body;

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!question || !question.trim()) {

      return res.status(400).json({
        message: 'Question is required.'
      });

    }

    const selectedLanguage =
      language || 'English';

    console.log('');
    console.log('======================================');
    console.log('Heritage AI chat request');
    console.log('Question:', question);
    console.log('Language:', selectedLanguage);
    console.log('======================================');


    // -------------------------------------------------
    // CHAT PROMPT
    // -------------------------------------------------

    const prompt = `
You are "Heritageverse AI Guide".

You ONLY answer questions related to:

- Indian heritage
- Indian history
- Indian culture
- Indian monuments
- Indian architecture
- Indian temples
- Indian forts
- Indian palaces
- Indian museums
- Indian art
- Indian sculptures
- Indian handicrafts
- Indian textiles
- Indian traditional clothing
- Indian traditional food
- Indian festivals
- Indian dances
- Indian music
- Indian traditions
- Indian languages and scripts related to heritage
- Indian mythology in a cultural or historical context
- Important people connected to Indian heritage

If the question is NOT related to Indian heritage,
Indian history, or Indian culture, reply EXACTLY:

"Sorry, I can only help with Indian heritage, history and culture."

Respond ONLY in this language:

${selectedLanguage}

Rules:

1. Be accurate.
2. Do not invent facts.
3. If you are unsure, clearly say that you are unsure.
4. Keep answers simple and easy to understand.
5. Do not mention Gemini.
6. Do not discuss unrelated topics.
7. Do not answer coding questions.
8. Do not answer mathematics questions.
9. Do not answer general politics questions.
10. Do not answer general sports questions.
11. Do not answer entertainment questions.
12. Do not give personal advice unless directly related to Indian heritage or culture.
13. Do not use tables.
14. For simple questions, give a short answer.
15. For historical questions, include dates or periods when useful.
16. Stay focused on Indian heritage, history and culture.

User question:

${question}
`;


    // =================================================
    // PROVIDER 1 — GEMINI
    // =================================================

    try {

      console.log('Trying Provider 1: Gemini...');

      const response =
        await gemini.models.generateContent({

          model: 'gemini-3.6-flash',

          contents: [
            {
              text: prompt
            }
          ]

        });

      const answer = response.text;

      if (answer) {

        console.log(
          '✅ Gemini answered successfully.'
        );

        return res.json({
          answer: answer.trim(),
          provider: 'Gemini'
        });

      }

      throw new Error(
        'Gemini returned an empty response.'
      );

    } catch (error) {

      console.error(
        '❌ Gemini failed:',
        error.message
      );

      console.log(
        'Switching to Provider 2...'
      );

    }


    // =================================================
    // PROVIDER 2 — GROQ
    // =================================================

    try {

      console.log('Trying Provider 2: Groq...');

      const completion =
        await groq.chat.completions.create({

          model: 'llama-3.3-70b-versatile',

          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],

          temperature: 0.3

        });

      const answer =
        completion.choices?.[0]?.message?.content;

      if (answer) {

        console.log(
          '✅ Groq answered successfully.'
        );

        return res.json({
          answer: answer.trim(),
          provider: 'Groq'
        });

      }

      throw new Error(
        'Groq returned an empty response.'
      );

    } catch (error) {

      console.error(
        '❌ Groq failed:',
        error.message
      );

      console.log(
        'Switching to Provider 3...'
      );

    }

    // =================================================
    // PROVIDER 3 — GEMINI
    // =================================================

    try {

      console.log('Trying Provider 3: Gemini...');

      const response =
        await gemini1.models.generateContent({

          model: 'gemini-3.6-flash',

          contents: [
            {
              text: prompt
            }
          ]

        });

      const answer = response.text;

      if (answer) {

        console.log(
          '✅ Gemini answered successfully.'
        );

        return res.json({
          answer: answer.trim(),
          provider: 'Gemini'
        });

      }

      throw new Error(
        'Gemini returned an empty response.'
      );

    } catch (error) {

      console.error(
        '❌ Gemini failed:',
        error.message
      );

      console.log(
        'Switching to Provider 4...'
      );

    }

    // =================================================
    // PROVIDER 4 — GEMINI
    // =================================================

    try {

      console.log('Trying Provider 4: Gemini...');

      const response =
        await gemini2.models.generateContent({

          model: 'gemini-3.6-flash',

          contents: [
            {
              text: prompt
            }
          ]

        });

      const answer = response.text;

      if (answer) {

        console.log(
          '✅ Gemini answered successfully.'
        );

        return res.json({
          answer: answer.trim(),
          provider: 'Gemini'
        });

      }

      throw new Error(
        'Gemini returned an empty response.'
      );

    } catch (error) {

      console.error(
        '❌ Gemini failed:',
        error.message
      );

      console.log(
        'Switching to Provider 4...'
      );

    }

    // =================================================
    // PROVIDER 5 — GEMINI
    // =================================================

    try {

      console.log('Trying Provider 5: Gemini...');

      const response =
        await gemini3.models.generateContent({

          model: 'gemini-3.6-flash',

          contents: [
            {
              text: prompt
            }
          ]

        });

      const answer = response.text;

      if (answer) {

        console.log(
          '✅ Gemini answered successfully.'
        );

        return res.json({
          answer: answer.trim(),
          provider: 'Gemini'
        });

      }

      throw new Error(
        'Gemini returned an empty response.'
      );

    } catch (error) {

      console.error(
        '❌ Gemini failed:',
        error.message
      );

      console.log(
        'Switching to Provider 4...'
      );

    }

    // =================================================
    // PROVIDER 6 — GEMINI
    // =================================================

    try {

      console.log('Trying Provider 6: Gemini...');

      const response =
        await gemini4.models.generateContent({

          model: 'gemini-3.6-flash',

          contents: [
            {
              text: prompt
            }
          ]

        });

      const answer = response.text;

      if (answer) {

        console.log(
          '✅ Gemini answered successfully.'
        );

        return res.json({
          answer: answer.trim(),
          provider: 'Gemini'
        });

      }

      throw new Error(
        'Gemini returned an empty response.'
      );

    } catch (error) {

      console.error(
        '❌ Gemini failed:',
        error.message
      );

      console.log(
        'Switching to Provider 4...'
      );

    }







    // =================================================
    // PROVIDER 4 — OPENROUTER
    // =================================================

    try {

      console.log(
        'Trying Provider 4: OpenRouter...'
      );

      const completion =
        await openrouter.chat.completions.create({

          model: 'openai/gpt-oss-20b:free',

          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]

        });

      const answer =
        completion.choices?.[0]?.message?.content;

      if (answer) {

        console.log(
          '✅ OpenRouter answered successfully.'
        );

        return res.json({
          answer: answer.trim(),
          provider: 'OpenRouter'
        });

      }

      throw new Error(
        'OpenRouter returned an empty response.'
      );

    } catch (error) {

      console.error(
        '❌ OpenRouter failed:',
        error.message
      );

    }


    // =================================================
    // ALL PROVIDERS FAILED
    // =================================================

    return res.status(503).json({

      message:
        'All AI providers are currently unavailable. Please try again later.'

    });


  } catch (error) {

    console.error('');
    console.error('======================================');
    console.error('AI CHAT ERROR');
    console.error('======================================');
    console.error(error);
    console.error('======================================');

    res.status(500).json({

      message:
        error.message ||
        'AI chat failed.'

    });

  }

});

// =====================================================
// FIREBASE USER AUTH
// READY FOR LATER
// =====================================================

async function requireFirebaseUser(req, res, next) {

  try {

    const header =
      req.headers.authorization || '';


    if (!header.startsWith('Bearer ')) {

      return res.status(401).json({

        message:
          'Missing Firebase ID token.'

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
// FIREBASE AUTH WILL BE USED HERE LATER
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
  console.log('Gemini Vision Scan: ENABLED');
  console.log('Heritage AI Chat: ENABLED');
  console.log('Firebase Auth: READY FOR LATER');
  console.log('======================================');
  console.log('');

});