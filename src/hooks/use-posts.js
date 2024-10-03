import { useState, useEffect } from 'react';
import {
  doc,
  where,
  endAt,
  query,
  limit,
  getDocs,
  orderBy,
  startAt,
  collection,
  onSnapshot,
  deleteDoc,
} from 'firebase/firestore';

import { db } from 'src/utils/firebase';
import { toast } from 'sonner';

export function usePosts(sortBy = 'latest', searchQuery = '', publish = 'all') {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};

    const q = searchQuery
      ? query(
          collection(db, 'posts'),
          orderBy('title'),
          startAt(searchQuery),
          endAt(`${searchQuery}\uf8ff`),
          limit(10)
        )
      : query(
          collection(db, 'posts'),
          ...[
            orderBy(sortBy === 'popular' ? 'totalViews' : 'createdAt', sortBy === 'oldest' ? 'asc' : 'desc'),
            limit(20),
            ...(publish !== 'all' ? [where('publish', '==', publish)] : []),
          ]
        );

    unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedPosts = querySnapshot.docs.map((_doc) => ({
          id: _doc.id,
          ..._doc.data(),
        }));
        setPosts(fetchedPosts);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching posts:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [sortBy, searchQuery, publish]);

  return { posts, loading };
}

export function useLatestPosts(count = 4) {
  const [latestPosts, setLatestPosts] = useState([]);
  const [latestPostsLoading, setLatestPostsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(count));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedPosts = querySnapshot.docs.map((_doc) => ({
          id: _doc.id,
          ..._doc.data(),
        }));
        setLatestPosts(fetchedPosts);
        setLatestPostsLoading(false);
      },
      (error) => {
        console.error('Error fetching latest posts:', error);
        setLatestPostsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [count]);

  return { latestPosts, latestPostsLoading };
}

export function useFetchPostById(id) {
  const [postById, setPostById] = useState(null);
  const [postByIdLoading, setPostByIdLoading] = useState(true);
  const [postError, setPostError] = useState(null);

  useEffect(() => {
    let unsubscribe = () => {};

    if (id) {
      const docRef = doc(db, 'posts', id);

      unsubscribe = onSnapshot(
        docRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            setPostById({ id: docSnapshot.id, ...docSnapshot.data() });
            setPostError(null);
          } else {
            setPostError('Post not found');
            setPostById(null);
          }
          setPostByIdLoading(false);
        },
        (error) => {
          console.error('Error fetching post:', error);
          setPostError(error.message);
          setPostByIdLoading(false);
        }
      );
    } else {
      setPostByIdLoading(false);
    }

    return () => unsubscribe();
  }, [id]);

  return { postById, postByIdLoading, postError };
}

export function useSearchPosts(searchQuery) {
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      if (searchQuery) {
        setSearchLoading(true);
        const lowercaseQuery = searchQuery.toLowerCase();

        const postsRef = collection(db, 'posts');
        const q = query(postsRef);

        try {
          const querySnapshot = await getDocs(q);
          const fetchedPosts = querySnapshot.docs
            .map(_doc => ({
              id: _doc.id,
              ..._doc.data()
            }))
            .filter(post => post.title && post.title.toLowerCase().includes(lowercaseQuery));

          setSearchResults(fetchedPosts);
        } catch (error) {
          console.error('Error fetching posts:', error);
        } finally {
          setSearchLoading(false);
        }
      } else {
        setSearchResults([]);
        setSearchLoading(false);
      }
    }

    fetchPosts();
  }, [searchQuery]);

  return { searchResults, searchLoading };
}

export function useSearchMarketingsPosts(searchQuery) {
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      if (searchQuery) {
        setSearchLoading(true);
        const lowercaseQuery = searchQuery.toLowerCase();

        const postsRef = collection(db, 'marketings');
        const q = query(postsRef);

        try {
          const querySnapshot = await getDocs(q);
          const fetchedPosts = querySnapshot.docs
            .map(_doc => ({
              id: _doc.id,
              ..._doc.data()
            }))
            .filter(post => post.title && post.title.toLowerCase().includes(lowercaseQuery));

          setSearchResults(fetchedPosts);
        } catch (error) {
          console.error('Error fetching marketings posts:', error);
        } finally {
          setSearchLoading(false);
        }
      } else {
        setSearchResults([]);
        setSearchLoading(false);
      }
    }

    fetchPosts();
  }, [searchQuery]);

  return { searchResults, searchLoading };
}

export const deletePostById = async (postId) => {
  try {
    await deleteDoc(doc(db, 'posts', postId));
    console.log(`Post with ID ${postId} successfully deleted`);
    toast.success('Post has been deleted');
    return true;
  } catch (error) {
    console.error('Error deleting post:', error);
    toast.error('Error deleting post');
    return false;
  }
};
