// userSlice.js
import { doc, getDoc } from 'firebase/firestore';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { db } from 'src/utils/firebase';

import { setRole } from './authSlice';

export const fetchUserData = createAsyncThunk(
  'user/fetchUserData',
  async (userId, { dispatch }) => {
    try {
      // Get user data from Firestore
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();

        // Set role in auth slice
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

const userSlice = createSlice({
  name: 'user',
  initialState: {
    data: null,
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    updateUserData: (state, action) => {
      state.data = { ...state.data, ...action.payload };
    },
    clearUserData: (state) => {
      state.data = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { updateUserData, clearUserData } = userSlice.actions;
export default userSlice.reducer;
