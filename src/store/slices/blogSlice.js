// blogSlice.js
import { getDocs, collection } from 'firebase/firestore';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { db } from 'src/utils/firebase';

export const fetchBlogPosts = createAsyncThunk(
  'blog/fetchBlogPosts',
  async () => {
    const querySnapshot = await getDocs(collection(db, 'posts'));
    const posts = [];
    querySnapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() });
    });
    if (posts.length > 0) {
      return posts;
    }
    throw new Error('Aucun post de blog trouvé !');
  }
);

const blogSlice = createSlice({
  name: 'blog',
  initialState: {
    posts: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBlogPosts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchBlogPosts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.posts = action.payload;
      })
      .addCase(fetchBlogPosts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export default blogSlice.reducer;
