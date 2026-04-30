const admin = require('firebase-admin');

// Verificar se as variáveis existem
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
  console.error('❌ Firebase credentials missing in .env file');
  process.exit(1);
}

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

// Inicializar Firebase
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { db, auth };