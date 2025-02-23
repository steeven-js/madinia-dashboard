// src/store/slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

import { ROLES, ROLE_PERMISSIONS } from 'src/auth/roles-permissions';

const initialState = {
  user: null,
  role: ROLES.USER,
  permissions: [],
  isAuthenticated: false,
  isLoading: true,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.isLoading = false;
    },
    setRole: (state, action) => {
      state.role = action.payload;
      state.permissions = ROLE_PERMISSIONS[action.payload] || ROLE_PERMISSIONS[ROLES.USER];
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearAuth: (state) => {
      state.user = null;
      state.role = ROLES.USER;
      state.permissions = ROLE_PERMISSIONS[ROLES.USER];
      state.isAuthenticated = false;
      state.error = null;
    },
    setPermissions: (state, action) => {
      state.permissions = action.payload;
    },
  }
});

export const { setUser, setRole, setError, clearAuth, setPermissions } = authSlice.actions;

export const selectUser = (state) => state.auth.user;
export const selectRole = (state) => state.auth.role;
export const selectPermissions = (state) => state.auth.permissions;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectError = (state) => state.auth.error;

export default authSlice.reducer;
