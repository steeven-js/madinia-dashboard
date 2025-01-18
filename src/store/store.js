import { configureStore } from '@reduxjs/toolkit'

import userReducer from 'src/store/slices/userSlice';
import blogReducer from 'src/store/slices/blogSlice';
import authReducer from 'src/store/slices/authSlice';
import marketingsPostReducer from 'src/store/slices/postMarketingsSlice';

import metricsReducer from './slices/metricsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    blog: blogReducer,
    marketingsPost: marketingsPostReducer,
    metrics: metricsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})
