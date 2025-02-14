import { useState, useEffect } from 'react';
import {
  ref,
  uploadBytes,
  deleteObject,
  getDownloadURL
} from 'firebase/storage';
import {
  doc,
  where,
  endAt,
  query,
  limit,
  getDoc,
  addDoc,
  setDoc,
  getDocs,
  orderBy,
  startAt,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
} from 'firebase/firestore';

import { createSlug } from 'src/utils/slug';
import { db, auth, storage } from 'src/utils/firebase';

/**
 * Hook pour récupérer et gérer la liste des posts avec filtrage et tri
 * @param {string} sortBy - Critère de tri ('latest', 'popular', 'oldest')
 * @param {string} searchQuery - Terme de recherche pour filtrer les posts
 * @param {string} publish - Statut de publication ('all', 'published', 'draft')
 * @returns {Object} { posts: Array, loading: boolean }
 */
export function usePosts(sortBy = 'latest', searchQuery = '', publish = 'all') {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => { };

    // Construction de la requête Firebase en fonction des paramètres
    const q = searchQuery
      ? query(  // Requête de recherche par titre
        collection(db, 'posts'),
        orderBy('title'),
        startAt(searchQuery),
        endAt(`${searchQuery}\uf8ff`), // Utilise le caractère high surrogate pour la recherche partielle
        limit(10)
      )
      : query(  // Requête standard avec tri et filtres
        collection(db, 'posts'),
        ...[
          // Applique le tri selon le paramètre sortBy
          orderBy(
            sortBy === 'popular' ? 'totalViews' : 'createdAt',
            sortBy === 'oldest' ? 'asc' : 'desc'
          ),
          limit(20),
          // Ajoute un filtre sur le statut de publication si nécessaire
          ...(publish !== 'all' ? [where('publish', '==', publish)] : []),
        ]
      );

    // Abonnement aux changements en temps réel
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

/**
 * Hook pour créer ou mettre à jour un post avec gestion des images
 * @returns {Object} { handleSubmit: Function }
 */
export function useSubmitPost() {
  const handleSubmit = async ({
    data,
    images,
    currentPost,
    isPublish,
    isCommentsEnabled
  }) => {
    try {
      const { coverUrl: initialCoverUrl, categoryId, ...otherData } = data;
      let coverUrl = initialCoverUrl;

      // Gestion de l'upload de l'image de couverture
      if (data.coverUrl && data.coverUrl instanceof File) {
        const postId = currentPost?.id || doc(collection(db, 'posts')).id;
        const fileName = `coverUrls/${postId}/${Date.now()}_${data.coverUrl.name}`;
        const storageRef = ref(storage, fileName);

        await uploadBytes(storageRef, data.coverUrl);
        coverUrl = await getDownloadURL(storageRef);
      }

      const now = Date.now();
      const slug = createSlug(otherData.title);

      // Construction des données du post
      const userData = {
        ...otherData,
        categoryId,
        coverUrl,
        postImages: images.map((img) => ({
          url: img.url,
          path: img.path,
          name: img.name,
        })),
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'Author',
        slug,
        author: [
          {
            avatarUrl: auth.currentUser.photoURL || 'https://api-dev-minimal-v6.vercel.app/assets/images/avatar/avatar-25.webp',
            name: auth.currentUser.displayName || 'Author',
          },
        ],
        updatedAt: now,
        totalViews: currentPost?.totalViews || 0,
        totalShares: currentPost?.totalShares || 0,
        totalComments: currentPost?.totalComments || 0,
        isCommentsEnabled,
        publish: isPublish ? 'published' : 'draft',
      };

      // Ajout de la date de création pour les nouveaux posts
      if (!currentPost) {
        userData.createdAt = now;
      }

      const usersRef = collection(db, 'posts');
      const newUserRef = currentPost ? doc(usersRef, currentPost.id) : doc(usersRef);

      // Mise à jour ou création du post
      if (currentPost) {
        // Gestion de la suppression des anciennes images
        const oldPost = await getDoc(newUserRef);
        if (oldPost.exists()) {
          const oldImages = oldPost.data().postImages || [];
          const newImagePaths = images.map((img) => img.path);

          // Identification des images à supprimer
          const deletedImages = oldImages.filter(
            (oldImg) => !newImagePaths.includes(oldImg.path)
          );

          // Suppression des images du storage
          await Promise.all(
            deletedImages.map(async (img) => {
              if (img.path) {
                const storageRef = ref(storage, img.path);
                try {
                  await deleteObject(storageRef);
                } catch (error) {
                  console.error('Error deleting old image:', error);
                }
              }
            })
          );
        }

        await updateDoc(newUserRef, userData);
      } else {
        await setDoc(newUserRef, userData);
      }

      return { success: true };
    } catch (error) {
      console.error('Submit error:', error);
      return { success: false, error };
    }
  };

  return { handleSubmit };
}

/**
 * Hook pour récupérer les derniers posts publiés
 * @param {number} count - Nombre de posts à récupérer
 * @returns {Object} { latestPosts: Array, latestPostsLoading: boolean }
 */
export function useLatestPosts(count = 4) {
  const [latestPosts, setLatestPosts] = useState([]);
  const [latestPostsLoading, setLatestPostsLoading] = useState(true);

  useEffect(() => {
    // Requête pour obtenir les derniers posts par date de création
    const q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(count)
    );

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
 * @returns {Object} { postById: Object, postByIdLoading: boolean, postError: string }
 */
export function useFetchPostById(id) {
  const [postById, setPostById] = useState(null);
  const [postByIdLoading, setPostByIdLoading] = useState(true);
  const [postError, setPostError] = useState(null);

  useEffect(() => {
    let unsubscribe = () => { };

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

/**
 * Hook pour la recherche de posts par titre
 * @param {string} searchQuery - Terme de recherche
 * @returns {Object} { searchResults: Array, searchLoading: boolean }
 */
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
          // Filtrage côté client pour plus de flexibilité
          const fetchedPosts = querySnapshot.docs
            .map(_doc => ({
              id: _doc.id,
              ..._doc.data()
            }))
            .filter(post => post.title &&
              post.title.toLowerCase().includes(lowercaseQuery));

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
 * Hook pour la recherche de posts marketing
 * @param {string} searchQuery - Terme de recherche
 * @returns {Object} { searchResults: Array, searchLoading: boolean }
 */
export function useSearchMarketingsPosts(searchQuery) {
  // Même logique que useSearchPosts mais pour la collection 'marketings'
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
            .filter(post => post.title &&
              post.title.toLowerCase().includes(lowercaseQuery));

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
 * Hook pour la gestion CRUD des catégories de posts
 * @returns {Object} Fonctions et états pour la gestion des catégories
 */
export const usePostCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Écoute des changements sur la collection des catégories
    const q = query(collection(db, 'postCategories'), orderBy('name'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedCategories = querySnapshot.docs.map((snapshot) => ({
          id: snapshot.id,
          ...snapshot.data(),
        }));
        setCategories(fetchedCategories);
        setLoading(false);
      },
      (fetchError) => {
        console.error('Erreur lors de la récupération des catégories:', fetchError);
        setError(fetchError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Opérations CRUD sur les catégories
  const getCategoryById = async (categoryId) => {
    try {
      const categoryRef = doc(db, 'postCategories', categoryId);
      const categorySnap = await getDoc(categoryRef);

      if (categorySnap.exists()) {
        return {
          id: categorySnap.id,
          ...categorySnap.data(),
        };
      }
      throw new Error('Catégorie non trouvée');
    } catch (err) {
      console.error('Erreur lors de la récupération de la catégorie:', err);
      throw err;
    }
  };

  const addCategory = async (categoryData) => {
    try {
      await addDoc(collection(db, 'postCategories'), categoryData);
    } catch (addError) {
      setError(addError);
      throw addError;
    }
  };

  const updateCategory = async (categoryId, categoryData) => {
    try {
      const categoryRef = doc(db, 'postCategories', categoryId);
      await updateDoc(categoryRef, categoryData);
    } catch (updateError) {
      setError(updateError);
      throw updateError;
    }
  };

  const deleteCategory = async (categoryId) => {
    try {
      const categoryRef = doc(db, 'postCategories', categoryId);
      await deleteDoc(categoryRef);
    } catch (deleteError) {
      setError(deleteError);
      throw deleteError;
    }
  };

  return {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
  };
};

/**
 * Hook pour mettre à jour le statut de publication d'un post
 * @returns {Object} { handleUpdatePublish: Function }
 */
export function useUpdatePostPublish() {
  const handleUpdatePublish = async (postId, newPublishStatus) => {
    try {
      // Mise à jour du statut de publication et de la date de modification
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        publish: newPublishStatus,
        updatedAt: Date.now(),
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating post publish status:', error);
      return { success: false, error };
    }
  };

  return { handleUpdatePublish };
}
