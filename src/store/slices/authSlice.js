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

      // Si l'utilisateur a un rôle dans ses claims Firebase, on l'utilise
      if (action.payload?.customClaims?.role) {
        const firebaseRole = action.payload.customClaims.role;
        state.role = firebaseRole;

        // Vérifier si le rôle existe dans notre configuration
        if (CONFIG.roles[firebaseRole]) {
          state.roleLevel = CONFIG.roles[firebaseRole].level;
          state.permissions = CONFIG.roles[firebaseRole].permissions;
        } else {
          // Rôle par défaut si le rôle Firebase n'est pas reconnu
          state.role = 'user';
          state.roleLevel = CONFIG.roles.user.level;
          state.permissions = CONFIG.roles.user.permissions;
        }
      } else if (action.payload?.role) {
        // Fallback sur le champ role standard si les claims ne sont pas disponibles
        const userRole = action.payload.role;
        state.role = userRole;

        if (CONFIG.roles[userRole]) {
          state.roleLevel = CONFIG.roles[userRole].level;
          state.permissions = CONFIG.roles[userRole].permissions;
        } else {
          state.role = 'user';
          state.roleLevel = CONFIG.roles.user.level;
          state.permissions = CONFIG.roles.user.permissions;
        }
      } else {
        // Aucun rôle trouvé, utiliser le rôle par défaut
        state.role = 'user';
        state.roleLevel = CONFIG.roles.user.level;
        state.permissions = CONFIG.roles.user.permissions;
      }
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

// Helper function to check if user has minimum role level
export const hasMinimumRoleLevel = (state, requiredLevel) => state.auth.roleLevel >= requiredLevel;

export const { setUser, setRole, setError, clearAuth } = authSlice.actions;
export default authSlice.reducer;
