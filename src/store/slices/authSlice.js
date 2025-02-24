// src/store/slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

import { CONFIG } from 'src/config-global';

const initialState = {
  user: null,
  role: null,
  permissions: [],
  roleLevel: 0,
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
      const role = action.payload;
      state.role = role;

      // Set role level and permissions based on CONFIG
      if (role && CONFIG.roles[role]) {
        state.roleLevel = CONFIG.roles[role].level;
        state.permissions = CONFIG.roles[role].permissions;
      } else {
        state.roleLevel = 0;
        state.permissions = [];
      }
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearAuth: (state) => {
      state.user = null;
      state.role = null;
      state.permissions = [];
      state.roleLevel = 0;
      state.isAuthenticated = false;
      state.error = null;
    }
  }
});

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectUserRole = (state) => state.auth.role;
export const selectUserPermissions = (state) => state.auth.permissions;
export const selectRoleLevel = (state) => state.auth.roleLevel;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

// Helper function to check permissions
export const hasPermission = (state, permission) => {
  const { permissions } = state.auth;
  return permissions.includes('all') || permissions.includes(permission);
};

export const { setUser, setRole, setError, clearAuth } = authSlice.actions;
export default authSlice.reducer;
