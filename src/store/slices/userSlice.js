// userSlice.js
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { db } from 'src/utils/firebase';

import { ROLES } from 'src/auth/roles-permissions';

export const fetchUserData = createAsyncThunk(
  'user/fetchUserData',
  async (userId) => {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    throw new Error('Aucun document trouvé !');
  }
);

export const updateUserRole = createAsyncThunk(
  'user/updateUserRole',
  async ({ userId, newRole }) => {
    if (!Object.values(ROLES).includes(newRole)) {
      throw new Error('Rôle invalide');
    }

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: new Date(),
    });

    return { userId, role: newRole };
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    data: null,
    status: 'idle',
    error: null,
    roleUpdateStatus: 'idle',
  },
  reducers: {
    resetStatus: (state) => {
      state.status = 'idle';
      state.error = null;
      state.roleUpdateStatus = 'idle';
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
      })
      .addCase(updateUserRole.pending, (state) => {
        state.roleUpdateStatus = 'loading';
      })
      .addCase(updateUserRole.fulfilled, (state, action) => {
        state.roleUpdateStatus = 'succeeded';
        if (state.data && state.data.id === action.payload.userId) {
          state.data.role = action.payload.role;
        }
      })
      .addCase(updateUserRole.rejected, (state, action) => {
        state.roleUpdateStatus = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { resetStatus } = userSlice.actions;

export const selectUserData = (state) => state.user.data;
export const selectUserStatus = (state) => state.user.status;
export const selectUserError = (state) => state.user.error;
export const selectRoleUpdateStatus = (state) => state.user.roleUpdateStatus;

export default userSlice.reducer;
