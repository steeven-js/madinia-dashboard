import { doc, setDoc, updateDoc } from 'firebase/firestore';
import {
  signOut as _signOut,
  signInWithPopup as _signInWithPopup,
  GoogleAuthProvider as _GoogleAuthProvider,
  GithubAuthProvider as _GithubAuthProvider,
  TwitterAuthProvider as _TwitterAuthProvider,
  sendPasswordResetEmail as _sendPasswordResetEmail,
  signInWithEmailAndPassword as _signInWithEmailAndPassword,
  createUserWithEmailAndPassword as _createUserWithEmailAndPassword,
} from 'firebase/auth';

import { AUTH, FIRESTORE } from 'src/lib/firebase';

// URL de base des Cloud Functions pour les opérations de logging uniquement
const FUNCTIONS_BASE_URL = process.env.NODE_ENV === 'development'
  ? 'https://us-central1-madinia-dashboard.cloudfunctions.net'
  : 'https://us-central1-madinia-dashboard.cloudfunctions.net';

/** **************************************
 * Sign in
 *************************************** */
export const signInWithPassword = async ({ email, password }) => {
  try {
    // Utiliser directement le SDK Firebase pour l'authentification
    const userCredential = await _signInWithEmailAndPassword(AUTH, email, password);
    const user = userCredential.user;

    // Vérifier si l'email est vérifié
    if (!user.emailVerified) {
      throw new Error('Email not verified!');
    }

    // Mettre à jour le document utilisateur
    const userRef = doc(FIRESTORE, 'users', user.uid);
    await updateDoc(userRef, {
      isVerified: true,
      lastConnection: new Date(),
    });

    // Enregistrer le log via Cloud Function
    const token = await user.getIdToken();
    await fetch(`${FUNCTIONS_BASE_URL}/addLog`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'login',
        details: {
          method: 'password'
        }
      }),
    });

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
    };
  } catch (error) {
    console.error('Error during sign in with password:', error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  const provider = new _GoogleAuthProvider();
  await _signInWithPopup(AUTH, provider);
};

export const signInWithGithub = async () => {
  const provider = new _GithubAuthProvider();
  await _signInWithPopup(AUTH, provider);
};

export const signInWithTwitter = async () => {
  const provider = new _TwitterAuthProvider();
  await _signInWithPopup(AUTH, provider);
};

/** **************************************
 * Sign up
 *************************************** */
export const signUp = async ({ email, password, displayName }) => {
  console.log('Début de la fonction signUp avec:', { email, displayName });
  try {
    // Utiliser directement le SDK Firebase pour la création de compte
    const userCredential = await _createUserWithEmailAndPassword(AUTH, email, password);
    const user = userCredential.user;

    // Créer le document utilisateur dans Firestore
    const userRef = doc(FIRESTORE, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email,
      displayName,
      isVerified: false,
      role: 'user',
      status: 'pending',
      createdAt: new Date(),
    });

    // Enregistrer le log via Cloud Function
    const token = await user.getIdToken();
    await fetch(`${FUNCTIONS_BASE_URL}/addLog`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'signup',
        details: {
          method: 'password'
        }
      }),
    });

    return { uid: user.uid };
  } catch (error) {
    console.error('Erreur détaillée lors de l\'inscription:', error);
    throw error;
  }
};

/** **************************************
 * Sign out
 *************************************** */
export const signOut = async () => {
  try {
    // Récupérer le token avant la déconnexion
    const token = await AUTH.currentUser?.getIdToken();

    if (token) {
      // Enregistrer le log de déconnexion
      await fetch(`${FUNCTIONS_BASE_URL}/addLog`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'logout',
          details: {}
        }),
      });
    }

    // Déconnecter l'utilisateur
    await _signOut(AUTH);
    window.location.href = '/auth/firebase/login';
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
};

/** **************************************
 * Reset password
 *************************************** */
export const sendPasswordResetEmail = async ({ email }) => {
  await _sendPasswordResetEmail(AUTH, email);
};
