// userSlice.js - Gestion des données utilisateur dans Redux
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';

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
 * Action asynchrone pour récupérer les données d'un utilisateur spécifique depuis Firestore
 */
export const fetchUserData = createAsyncThunk(
  'user/fetchUserData',
  async (userId, { dispatch }) => {
    try {
      // console.log('🚀 Fetching user data for:', userId);
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        // console.log('📥 User data received:', userData);

        if (userData.role) {
          dispatch(setRole(userData.role));
        }

        return userData;
      }
      throw new Error('No user document found!');
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      throw error;
    }
  }
);

/**
 * Action asynchrone pour récupérer tous les utilisateurs depuis Firestore
 */
export const fetchAllUsers = createAsyncThunk(
  'user/fetchAllUsers',
  async (_, { dispatch }) => {
    try {
      // console.log('🚀 Fetching all users data');
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);

      const users = [];
      querySnapshot.forEach((docSnapshot) => {
        users.push({
          id: docSnapshot.id,
          ...docSnapshot.data()
        });
      });

      // console.log('📥 All users data received:', users);
      return users;
    } catch (error) {
      console.error('❌ Error fetching all users:', error);
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
    users: [], // Liste de tous les utilisateurs
    status: 'idle', // Indique l'état du chargement des données
    error: null, // Stocke les messages d'erreur éventuels
  },
  // Reducers pour les actions synchrones
  reducers: {
    // Met à jour partiellement les données utilisateur en fusionnant avec les données existantes
    updateUserData: (state, action) => {
      state.data = { ...state.data, ...action.payload };
      // console.log('🔄 User data updated:', state.data);
    },
    // Réinitialise complètement l'état du slice aux valeurs par défaut
    clearUserData: (state) => {
      state.data = null;
      state.users = [];
      state.status = 'idle';
      state.error = null;
      // console.log('🧹 User data cleared');
    },
  },
  // Gestion des actions asynchrones avec extraReducers
  extraReducers: (builder) => {
    builder
      // Gestion de fetchUserData
      .addCase(fetchUserData.pending, (state) => {
        state.status = 'loading';
        // console.log('⏳ Loading user data...');
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
        state.error = null;
        // console.log('✅ User data loaded successfully');
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
        // console.log('❌ Failed to load user data:', action.error.message);
      })
      // Gestion de fetchAllUsers
      .addCase(fetchAllUsers.pending, (state) => {
        state.status = 'loading';
        // console.log('⏳ Loading all users...');
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.users = action.payload;
        state.error = null;
        // console.log('✅ All users loaded successfully');
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
        // console.log('❌ Failed to load all users:', action.error.message);
      });
  },
});

// Export des actions et du reducer pour utilisation dans l'application
export const { updateUserData, clearUserData } = userSlice.actions;
export default userSlice.reducer;
