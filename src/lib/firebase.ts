// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Check if Firebase is configured
const isFirebaseConfigured = () => {
  return import.meta.env.VITE_FIREBASE_API_KEY && 
         import.meta.env.VITE_FIREBASE_PROJECT_ID;
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "demo-app-id"
};

// Initialize Firebase
let app: any;
let auth: any;
let googleProvider: any;
let db: any;

try {
  app = initializeApp(firebaseConfig);
  
  // Initialize Firebase Authentication
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  
  // Configurar GoogleAuthProvider para evitar problemas de CORS
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
  
  // Initialize Cloud Firestore
  db = getFirestore(app);
  
  if (!isFirebaseConfigured()) {
    console.warn('🔥 Firebase no está configurado correctamente. Usando datos mock.');
    console.warn('📖 Consulta FIREBASE_SETUP.md para configurar Firebase.');
  }
} catch (error) {
  console.error('❌ Error inicializando Firebase:', error);
  console.warn('📖 Consulta FIREBASE_SETUP.md para configurar Firebase correctamente.');
}

export { auth, googleProvider, db, isFirebaseConfigured };
export default app;