import { configureStore } from '@reduxjs/toolkit'

import userReducer from 'src/store/slices/userSlice';
import blogReducer from 'src/store/slices/blogSlice';
import marketingsPostReducer from 'src/store/slices/postMarketingsSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    blog: blogReducer,
    marketingsPost: marketingsPostReducer,
  },
})
