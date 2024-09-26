// postSlice.js
import { getDocs, collection } from 'firebase/firestore';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { db } from 'src/utils/firebase';

export const fetchMarketingsPosts = createAsyncThunk(
  'post/fetchMarketingsPosts',
  async () => {
    const querySnapshot = await getDocs(collection(db, 'marketings'));
    const marketingsPosts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (marketingsPosts.length === 0) {
      throw new Error('Aucun post de marketing trouvé !');
    }
    return marketingsPosts;
  }
);

const postMarketingsSlice = createSlice({
  name: 'marketingsPost',
  initialState: {
    marketingsPosts: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarketingsPosts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMarketingsPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.marketingsPosts = action.payload;
      })
      .addCase(fetchMarketingsPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      });
  },
});

export default postMarketingsSlice.reducer;
