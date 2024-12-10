import { toast } from 'sonner';
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
  deleteDoc,
  collection,
  onSnapshot,
} from 'firebase/firestore';

import { db } from 'src/utils/firebase';

/**
 * Hook principal pour récupérer et filtrer les posts
 * @param {string} [sortBy='latest'] - Critère de tri ('latest', 'oldest', 'popular')
 * @param {string} [searchQuery=''] - Terme de recherche pour filtrer les posts
 * @param {string} [publish='all'] - Statut de publication ('all', 'draft', 'published')
 * @returns {{
 *   posts: Array<{
 *     id: string,
 *     title: string,
 *     createdAt: timestamp,
 *     totalViews: number,
 *     publish: string,
 *     [key: string]: any
 *   }>,
 *   loading: boolean
 * }}
 */
export function usePosts(sortBy = 'latest', searchQuery = '', publish = 'all') {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => { };

    // Construction de la requête selon les critères
    const q = searchQuery
      ? query( // Requête de recherche par titre
        collection(db, 'posts'),
        orderBy('title'),
        startAt(searchQuery),
        endAt(`${searchQuery}\uf8ff`),
        limit(10)
      )
      : query( // Requête standard avec tri et filtres
        collection(db, 'posts'),
        ...[
          orderBy(sortBy === 'popular' ? 'totalViews' : 'createdAt', sortBy === 'oldest' ? 'asc' : 'desc'),
          limit(20),
          ...(publish !== 'all' ? [where('publish', '==', publish)] : []),
        ]
      );

    // Souscription aux changements en temps réel
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

    // Nettoyage de la souscription
    return () => unsubscribe();
  }, [sortBy, searchQuery, publish]);

  return { posts, loading };
}

/**
 * Hook pour récupérer les derniers posts
 * @param {number} [count=4] - Nombre de posts à récupérer
 * @returns {{
 *   latestPosts: Array<{
 *     id: string,
 *     createdAt: timestamp,
 *     [key: string]: any
 *   }>,
 *   latestPostsLoading: boolean
 * }}
 */
export function useLatestPosts(count = 4) {
  const [latestPosts, setLatestPosts] = useState([]);
  const [latestPostsLoading, setLatestPostsLoading] = useState(true);

  useEffect(() => {
    // Requête pour obtenir les derniers posts
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

/**
 * Hook pour récupérer un post spécifique par son ID
 * @param {string} id - ID du post à récupérer
 * @returns {{
 *   postById: {
 *     id: string,
 *     [key: string]: any
 *   }|null,
 *   postByIdLoading: boolean,
 *   postError: string|null
 * }}
 */
export function useFetchPostById(id) {
  const [postById, setPostById] = useState(null);
  const [postByIdLoading, setPostByIdLoading] = useState(true);
  const [postError, setPostError] = useState(null);

  useEffect(() => {
    let unsubscribe = () => { };

    if (id) {
      // Référence au document spécifique
      const docRef = doc(db, 'posts', id);

      // Souscription aux changements du document
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

/**
 * Hook pour rechercher des posts par titre
 * @param {string} searchQuery - Terme de recherche
 * @returns {{
 *   searchResults: Array<{
 *     id: string,
 *     title: string,
 *     [key: string]: any
 *   }>,
 *   searchLoading: boolean
 * }}
 */
export function useSearchPosts(searchQuery) {
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(true);

  useEffect(() => {
    /**
     * Fonction interne pour effectuer la recherche de posts
     */
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

/**
 * Hook pour rechercher des posts marketing par titre
 * @param {string} searchQuery - Terme de recherche
 * @returns {{
 *   searchResults: Array<{
 *     id: string,
 *     title: string,
 *     [key: string]: any
 *   }>,
 *   searchLoading: boolean
 * }}
 */
export function useSearchMarketingsPosts(searchQuery) {
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(true);

  useEffect(() => {
    /**
     * Fonction interne pour effectuer la recherche de posts marketing
     */
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

/**
 * Supprime un post par son ID
 * @param {string} postId - ID du post à supprimer
 * @returns {Promise<boolean>} true si la suppression est réussie, false sinon
 */
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
