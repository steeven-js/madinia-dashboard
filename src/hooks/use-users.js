import { updateProfile } from 'firebase/auth';
import { useState, useEffect, useCallback } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, addDoc, updateDoc, onSnapshot, collection } from 'firebase/firestore';

import { db, auth, storage } from 'src/utils/firebase';

import { toast } from 'src/components/snackbar';

/**
 * Récupère l'ID de l'utilisateur actuellement connecté
 * @returns {string|undefined} L'ID de l'utilisateur ou undefined si non connecté
 */
const getCurrentUserUid = () => auth.currentUser?.uid;

/**
 * Hook pour récupérer la liste des utilisateurs avec mise à jour en temps réel
 * @returns {{
 *   users: Array<{id: string, [key: string]: any}>, // Liste des utilisateurs
 *   loading: boolean // État du chargement
 * }}
 */
export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Référence à la collection users
    const usersRef = collection(db, 'users');

    // Souscription aux changements en temps réel
    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const fetchedUsers = snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        }));
        setUsers(fetchedUsers);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching users:', error);
        setLoading(false);
      }
    );

    // Nettoyage de la souscription
    return () => unsubscribe();
  }, []);

  return { users, loading };
};

/**
 * Hook étendu pour gérer les données utilisateurs avec fonction de mise à jour
 * @returns {{
 *   users: Array<{id: string, [key: string]: any}>, // Liste des utilisateurs
 *   loading: boolean, // État du chargement
 *   updateUsersList: (newUsers: Array) => void // Fonction pour mettre à jour la liste
 * }}
 */
export const useUsersData = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const fetchedUsers = snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        }));
        setUsers(fetchedUsers);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching users:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Fonction mémorisée pour mettre à jour la liste des utilisateurs
  const updateUsersList = useCallback((newUsers) => setUsers(newUsers), []);

  return { users, loading, updateUsersList };
};

/**
 * Hook pour récupérer un utilisateur spécifique par son ID
 * @param {string} id - ID de l'utilisateur à récupérer
 * @returns {{
 *   user: {id: string, [key: string]: any} | null, // Données de l'utilisateur
 *   loading: boolean // État du chargement
 * }}
 */
export const useUserById = (id) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setUser(null);
      setLoading(false);
      return () => { };
    }

    // Référence au document utilisateur
    const userDocRef = doc(db, 'users', id);

    // Souscription aux changements en temps réel
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setUser({ id: docSnapshot.id, ...docSnapshot.data() });
        } else {
          console.error('No such document!');
          setUser(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching user:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  return { user, loading };
};

/**
 * Met à jour ou crée un utilisateur avec gestion de l'avatar
 * @param {Object} params - Paramètres de la fonction
 * @param {Object} params.data - Données de l'utilisateur
 * @param {string|null} [params.id=null] - ID de l'utilisateur (null pour création)
 * @returns {Promise<{
 *   success: boolean,
 *   id: string,
 *   data: Object
 * }>}
 */
export const updateOrCreateUserData = async ({ data, id = null }) => {
  // Extraction de l'avatar et des autres données
  const { avatarUrl: newAvatarFile, ...otherData } = data;
  let avatarUrl = newAvatarFile;

  try {
    // Gestion du téléchargement de l'avatar si c'est un nouveau fichier
    if (newAvatarFile instanceof File) {
      const fileExtension = newAvatarFile.name.split('.').pop().toLowerCase();
      const avatarId = id;
      const fileName = `avatars/${avatarId}/avatar.${fileExtension}`;
      const storageRef = ref(storage, fileName);

      await uploadBytes(storageRef, newAvatarFile);
      avatarUrl = await getDownloadURL(storageRef);
    }

    // Préparation des données utilisateur
    const userData = {
      ...otherData,
      updatedAt: Date.now(),
    };

    if (avatarUrl) {
      userData.avatarUrl = avatarUrl;
    }

    let { id: userId } = { id };

    if (id) {
      // Mise à jour d'un utilisateur existant
      const userRef = doc(db, 'users', id);
      await updateDoc(userRef, userData);

      // Mise à jour du profil auth si nécessaire
      if (auth.currentUser && (otherData.name || avatarUrl)) {
        const profileUpdates = {};

        if (otherData.name) {
          profileUpdates.displayName = otherData.name;
        }

        if (avatarUrl) {
          profileUpdates.photoURL = avatarUrl;
        }

        await updateProfile(auth.currentUser, profileUpdates);
      }
    } else {
      // Création d'un nouvel utilisateur
      userData.createdAt = Date.now();
      userData.status = 'active';
      const newUserRef = await addDoc(collection(db, 'users'), userData);
      userId = newUserRef.id;
    }

    toast.success(userId ? 'Mise à jour réussie !' : 'Création réussie !');

    return {
      success: true,
      id: userId,
      data: userData
    };

  } catch (error) {
    console.error('Erreur lors de la mise à jour/création de l\'utilisateur:', error);
    toast.error('Une erreur est survenue lors de la mise à jour/création');
    throw error;
  }
};

/**
 * Met à jour rapidement les données d'un utilisateur
 * @param {Object} params - Paramètres de la fonction
 * @param {Object} params.data - Données à mettre à jour
 * @throws {Error} Si aucun utilisateur n'est connecté
 * @returns {Promise<void>}
 */
export const updateFastUsers = async ({ data }) => {
  const uid = getCurrentUserUid();
  if (!uid) {
    throw new Error("No user is currently logged in");
  }

  const userRef = doc(db, 'users', uid);

  try {
    await updateDoc(userRef, data);
    toast.success('Mise à jour rapide réussie !');
  } catch (error) {
    console.error('Erreur lors de la mise à jour rapide de l\'utilisateur:', error);
    toast.error('Une erreur est survenue lors de la mise à jour rapide');
    throw error;
  }
};

/**
 * Met à jour le rôle d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {string} newRole - Nouveau rôle à attribuer
 * @returns {Promise<void>}
 */
export const updateUserRole = async (userId, newRole) => {
  if (!userId) {
    throw new Error("L'ID de l'utilisateur est requis");
  }

  const userRef = doc(db, 'users', userId);

  try {
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: Date.now()
    });
    toast.success('Rôle mis à jour avec succès !');
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rôle:', error);
    toast.error('Une erreur est survenue lors de la mise à jour du rôle');
    throw error;
  }
};

/**
 * Met à jour le statut d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {string} newStatus - Nouveau statut à attribuer
 * @returns {Promise<void>}
 */
export const updateUserStatus = async (userId, newStatus) => {
  if (!userId) {
    throw new Error("L'ID de l'utilisateur est requis");
  }

  const userRef = doc(db, 'users', userId);

  try {
    await updateDoc(userRef, {
      status: newStatus,
      updatedAt: Date.now()
    });
    toast.success('Statut mis à jour avec succès !');
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    toast.error('Une erreur est survenue lors de la mise à jour du statut');
    throw error;
  }
};
