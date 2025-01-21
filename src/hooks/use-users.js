import { updateProfile } from 'firebase/auth';
import { useState, useEffect, useCallback } from 'react';
import { ref, uploadBytes, deleteObject, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, updateDoc, onSnapshot, collection, serverTimestamp } from 'firebase/firestore';

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
 * @param {Object} params.currentUser - Utilisateur actuel
 * @param {Object} params.data - Données à mettre à jour
 * @returns {Promise<void>}
 */
export async function updateOrCreateUserData({ currentUser, data }) {
  if (!currentUser?.id) {
    throw new Error('ID utilisateur manquant');
  }

  try {
    console.log('Début de la mise à jour:', { currentUser, data });

    let avatarUrl = null;

    // Gestion de l'avatar
    if (data.avatarUrl instanceof File) {
      // Supprimer l'ancienne image si elle existe
      if (currentUser.avatarUrl) {
        try {
          const oldAvatarRef = ref(storage, currentUser.avatarUrl);
          await deleteObject(oldAvatarRef);
          console.log('Ancienne image supprimée avec succès');
        } catch (error) {
          console.warn('Erreur lors de la suppression de l\'ancienne image:', error);
          // On continue même si la suppression échoue
        }
      }

      // Upload du nouveau fichier avec un nom standardisé
      const fileExtension = data.avatarUrl.name.split('.').pop();
      const storageRef = ref(storage, `avatars/${currentUser.id}/avatar.${fileExtension}`);
      await uploadBytes(storageRef, data.avatarUrl);
      avatarUrl = await getDownloadURL(storageRef);

      // Mise à jour du profil Auth avec le nouvel avatar
      await updateProfile(auth.currentUser, {
        photoURL: avatarUrl
      });
    } else if (typeof data.avatarUrl === 'string' && data.avatarUrl.startsWith('http')) {
      // Conserver l'URL existante
      const { avatarUrl: existingAvatarUrl } = data;
      avatarUrl = existingAvatarUrl;
    }

    // Préparation des données à mettre à jour
    const userData = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    if (avatarUrl) {
      userData.avatarUrl = avatarUrl;
    }

    // Mise à jour du document dans Firestore
    const userRef = doc(db, 'users', currentUser.id);
    await setDoc(userRef, userData, { merge: true });

    // Mise à jour du profil Auth avec le nouveau displayName
    await updateProfile(auth.currentUser, {
      displayName: data.displayName
    });

    toast.success('Profil mis à jour avec succès');

    console.log('Mise à jour réussie:', {
      firestoreData: userData,
      authProfile: {
        displayName: data.displayName,
        photoURL: avatarUrl
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    toast.error('Erreur lors de la mise à jour du profil');
    throw error;
  }
}

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
