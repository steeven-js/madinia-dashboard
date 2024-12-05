import { updateProfile } from 'firebase/auth';
import { useState, useEffect, useCallback } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, addDoc, updateDoc, onSnapshot, collection } from 'firebase/firestore';

import { db, auth, storage } from 'src/utils/firebase';

import { toast } from 'src/components/snackbar';

const getCurrentUserUid = () => auth.currentUser?.uid;

export const useUsers = () => {
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

  return { users, loading };
};

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

  const updateUsersList = useCallback((newUsers) => setUsers(newUsers), []);

  return { users, loading, updateUsersList };
};

export const useUserById = (id) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setUser(null);
      setLoading(false);
      // Return a no-op cleanup function
      return () => {};
    }

    const userDocRef = doc(db, 'users', id);
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

export const updateOrCreateUserData = async ({ data, id = null }) => {
  const { avatarUrl: newAvatarFile, ...otherData } = data;
  let avatarUrl = newAvatarFile;
  let userRef;

  try {
    // Gestion de l'avatar si c'est un nouveau fichier
    if (newAvatarFile instanceof File) {
      const fileExtension = newAvatarFile.name.split('.').pop().toLowerCase();
      // Si pas d'ID, on en génère un pour le stockage de l'avatar
      const avatarId = id;
      const fileName = `avatars/${avatarId}/avatar.${fileExtension}`;
      const storageRef = ref(storage, fileName);

      await uploadBytes(storageRef, newAvatarFile);
      avatarUrl = await getDownloadURL(storageRef);
    }

    // Préparation des données pour Firestore
    const userData = {
      ...otherData,
      updatedAt: Date.now(),
    };

    if (avatarUrl) {
      userData.avatarUrl = avatarUrl;
    }

    // Création ou mise à jour selon la présence de l'ID
    if (id) {
      // Mise à jour
      userRef = doc(db, 'users', id);
      await updateDoc(userRef, userData);

      // Mise à jour du profil auth si l'utilisateur est connecté
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
      // Création
      userData.createdAt = Date.now();
      userData.status = 'active';
      const newUserRef = await addDoc(collection(db, 'users'), userData);
      userRef = newUserRef;
      id = newUserRef.id;
    }

    toast.success(id ? 'Mise à jour réussie !' : 'Création réussie !');

    return {
      success: true,
      id,
      data: userData
    };

  } catch (error) {
    console.error('Erreur lors de la mise à jour/création de l\'utilisateur:', error);
    toast.error('Une erreur est survenue lors de la mise à jour/création');
    throw error;
  }
};

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
