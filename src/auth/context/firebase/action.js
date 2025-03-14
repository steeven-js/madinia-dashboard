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

/** **************************************
 * Sign in
 *************************************** */
export const signInWithPassword = async ({ email, password }) => {
  try {
    await _signInWithEmailAndPassword(AUTH, email, password);

    const user = AUTH.currentUser;

    /* Désactivation de la vérification d'email en développement
    if (!user?.emailVerified) {
      throw new Error('Email not verified!');
    }
    */

    // Récupérer l'uid de l'utilisateur créé
    const { uid } = user;

    // Créer un document utilisateur
    const userRef = doc(FIRESTORE, 'users', uid);

    // Enregistrer les données utilisateur
    await updateDoc(userRef, {
      email,
      isVerified: true,
      lastConnection: new Date(),
    });

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
    console.log('Tentative de création de l\'utilisateur avec:', { email, password });
    const newUser = await _createUserWithEmailAndPassword(AUTH, email, password);
    console.log('Utilisateur créé avec succès:', newUser.user.uid);

    /*
     * (1) If skip emailVerified
     * Remove : await _sendEmailVerification(newUser.user);
     */
    // await _sendEmailVerification(newUser.user);

    // Récupérer l'uid de l'utilisateur créé
    const { uid } = newUser.user;
    console.log('UID de l\'utilisateur:', uid);

    // Créer un document utilisateur
    const userRef = doc(FIRESTORE, 'users', uid);
    console.log('Référence du document utilisateur créée');

    // Enregistrer les données utilisateur
    console.log('Tentative d\'enregistrement des données utilisateur dans Firestore');
    await setDoc(userRef, {
      uid,
      email,
      displayName,
      isVerified: false,
      role: 'user',
      status: 'pending',
      createdAt: new Date(),
    });
    console.log('Données utilisateur enregistrées avec succès dans Firestore');

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
    await _signOut(AUTH);
    // Redirection gérée par les guards après la mise à jour du state
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
