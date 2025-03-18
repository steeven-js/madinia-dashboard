// index.js - Cloud Function en ES modules
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as functions from 'firebase-functions';
import cors from 'cors';

// Initialiser l'application Firebase avec les credentials
initializeApp({
  credential: cert('./madinia-dashboard-firebase-adminsdk-fbsvc-0bbf6e78a4.json')
});

// Obtenir des références aux services Firebase
const db = getFirestore();
const auth = getAuth();
const corsMiddleware = cors({ origin: true });

// Helper function to wrap cors middleware
const corsHandler = (req, res) => new Promise((resolve, reject) => {
  corsMiddleware(req, res, (err) => {
    if (err) {
      reject(err);
    } else {
      resolve();
    }
  });
});

/**
 * Fonction Cloud pour l'authentification par email/mot de passe
 */
export const signInWithPassword = functions.https.onRequest(async (req, res) => {
  try {
    await corsHandler(req, res);

    // Vérifier la méthode HTTP
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Vérifier l'authentification avec Firebase
    const userRecord = await auth.getUserByEmail(email);

    // Vérifier si l'email est vérifié
    if (!userRecord.emailVerified) {
      return res.status(403).json({ error: 'Email not verified!' });
    }

    // Mettre à jour le document utilisateur
    const userRef = db.collection('users').doc(userRecord.uid);
    await userRef.update({
      isVerified: true,
      lastConnection: new Date(),
    });

    // Générer un token personnalisé pour le client
    const token = await auth.createCustomToken(userRecord.uid);

    // Log de connexion
    await db.collection('logs').add({
      action: 'login',
      userId: userRecord.uid,
      email: userRecord.email,
      timestamp: new Date(),
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    res.status(200).json({
      token,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
      }
    });
  } catch (error) {
    console.error('Error during sign in with password:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Fonction Cloud pour l'inscription
 */
export const signUp = functions.https.onRequest(async (req, res) => {
  try {
    await corsHandler(req, res);

    // Vérifier la méthode HTTP
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Email, password, and displayName are required' });
    }

    // Créer un nouvel utilisateur
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: false, // Par défaut, l'email n'est pas vérifié
    });

    // Créer un document utilisateur dans Firestore
    const userRef = db.collection('users').doc(userRecord.uid);
    await userRef.set({
      uid: userRecord.uid,
      email,
      displayName,
      isVerified: false,
      role: 'user',
      status: 'pending',
      createdAt: new Date(),
    });

    // Log d'inscription
    await db.collection('logs').add({
      action: 'signup',
      userId: userRecord.uid,
      email,
      timestamp: new Date(),
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    res.status(201).json({
      message: 'User created successfully',
      userId: userRecord.uid
    });
  } catch (error) {
    console.error('Error during sign up:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Fonction Cloud pour la déconnexion (côté serveur)
 */
export const signOut = functions.https.onRequest(async (req, res) => {
  try {
    await corsHandler(req, res);

    // Vérifier la méthode HTTP
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Log de déconnexion
    await db.collection('logs').add({
      action: 'logout',
      userId: uid,
      timestamp: new Date(),
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    // La révocation du token n'est pas nécessaire ici car Firebase gère les tokens côté client
    res.status(200).json({ message: 'Signed out successfully' });
  } catch (error) {
    console.error('Error during sign out:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Fonction Cloud pour réinitialiser le mot de passe
 */
export const resetPassword = functions.https.onRequest(async (req, res) => {
  try {
    await corsHandler(req, res);

    // Vérifier la méthode HTTP
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Générer un lien de réinitialisation de mot de passe
    const actionCodeSettings = {
      url: `${req.headers.origin}/auth/reset-password-confirm`,
      handleCodeInApp: true,
    };

    await auth.generatePasswordResetLink(email, actionCodeSettings);

    // Log de demande de réinitialisation
    const userRecord = await auth.getUserByEmail(email);
    await db.collection('logs').add({
      action: 'password_reset_request',
      userId: userRecord.uid,
      email,
      timestamp: new Date(),
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Error during password reset:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Fonction Cloud pour récupérer les logs de connexion
 */
export const getLogs = functions.https.onRequest(async (req, res) => {
  try {
    await corsHandler(req, res);

    // Vérifier la méthode HTTP
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Vérifier si l'utilisateur est un administrateur
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (!userData || userData.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    // Récupérer tous les logs, triés par date décroissante
    const logsQuery = await db.collection('logs')
      .orderBy('timestamp', 'desc')
      .limit(100) // Limiter le nombre de logs retournés
      .get();

    const logs = [];
    logsQuery.forEach(doc => {
      logs.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate().toISOString()
      });
    });

    res.status(200).json({ logs });
  } catch (error) {
    console.error('Error retrieving logs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Fonction Cloud pour ajouter un log personnalisé
 */
export const addLog = functions.https.onRequest(async (req, res) => {
  try {
    await corsHandler(req, res);

    // Vérifier la méthode HTTP
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const { action, details } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    // Récupérer les informations de l'utilisateur
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    // Ajouter le log
    await db.collection('logs').add({
      action,
      userId: uid,
      email: userData.email,
      displayName: userData.displayName,
      details: details || {},
      timestamp: new Date(),
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    res.status(201).json({ message: 'Log added successfully' });
  } catch (error) {
    console.error('Error adding log:', error);
    res.status(500).json({ error: error.message });
  }
});
