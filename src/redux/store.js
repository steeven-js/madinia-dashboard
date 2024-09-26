// store.js
import { configureStore } from '@reduxjs/toolkit';

import userSlice from 'src/redux/slice/userSlice';

export const store = configureStore({
  reducer: {
    user: userSlice,
  },
});
