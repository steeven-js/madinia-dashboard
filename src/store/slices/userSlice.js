// userSlice.js - Gestion des données utilisateur dans Redux
import { doc, getDoc } from 'firebase/firestore';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { db } from 'src/utils/firebase';

import { setRole } from './authSlice';

/**
 * createAsyncThunk est une fonction de Redux Toolkit qui simplifie la création d'actions asynchrones.
 * Elle prend 2 arguments :
 * 1. Un type d'action (ici 'user/fetchUserData') qui servira de préfixe pour 3 actions générées automatiquement :
 *    - 'user/fetchUserData/pending' : déclenchée au début de l'appel
 *    - 'user/fetchUserData/fulfilled' : déclenchée en cas de succès
 *    - 'user/fetchUserData/rejected' : déclenchée en cas d'erreur
 * 2. Une fonction asynchrone (le "payload creator") qui contient la logique asynchrone
 */

/**
 * Action asynchrone pour récupérer les données utilisateur depuis Firestore
 * @param {string} userId - L'ID de l'utilisateur
 * @returns {Object} Les données de l'utilisateur
 */
export const fetchUserData = createAsyncThunk(
  'user/fetchUserData',
  async (userId, { dispatch }) => {
    try {
      // Récupération des données utilisateur depuis Firestore
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();

        // Mise à jour du rôle dans le slice d'authentification
        if (userData.role) {
          dispatch(setRole(userData.role));
        }

        return userData;
      }
      throw new Error('No user document found!');
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  }
);

/**
 * Slice Redux pour la gestion des données utilisateur
 * Contient l'état et les actions pour manipuler les données utilisateur
 */
const userSlice = createSlice({
  name: 'user',
  // État initial du slice
  initialState: {
    data: null, // Stocke les données de l'utilisateur
    status: 'idle', // Indique l'état du chargement des données
    error: null, // Stocke les messages d'erreur éventuels
  },
  // Reducers pour les actions synchrones
  reducers: {
    // Met à jour partiellement les données utilisateur en fusionnant avec les données existantes
    updateUserData: (state, action) => {
      state.data = { ...state.data, ...action.payload };
    },
    // Réinitialise complètement l'état du slice aux valeurs par défaut
    clearUserData: (state) => {
      state.data = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  // Gestion des actions asynchrones avec extraReducers
  extraReducers: (builder) => {
    builder
      // Quand fetchUserData démarre
      .addCase(fetchUserData.pending, (state) => {
        state.status = 'loading';
      })
      // Quand fetchUserData réussit
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
        state.error = null;
      })
      // Quand fetchUserData échoue
      .addCase(fetchUserData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

// Export des actions et du reducer pour utilisation dans l'application
export const { updateUserData, clearUserData } = userSlice.actions;
export default userSlice.reducer;
