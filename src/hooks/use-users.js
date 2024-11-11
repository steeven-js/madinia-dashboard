import { updateProfile } from 'firebase/auth';
import { useState, useEffect, useCallback } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, onSnapshot, collection } from 'firebase/firestore';

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

export const updateUserData = async ({ data }) => {
  const { avatarUrl: newAvatarFile, ...otherData } = data;
  let avatarUrl = newAvatarFile;

  const uid = getCurrentUserUid();
  if (!uid) {
    throw new Error("No user is currently logged in");
  }

  const userRef = doc(db, 'users', uid);

  try {
    // Mise à jour du profil auth si un nouveau displayName est fourni
    if (otherData.displayName && auth.currentUser) {
      const profileUpdates = {
        displayName: otherData.displayName
      };

      // Gestion de l'avatar si c'est un nouveau fichier
      if (newAvatarFile instanceof File) {
        const fileExtension = newAvatarFile.name.split('.').pop();
        const fileName = `avatars/${uid}/avatar.${fileExtension}`;
        const storageRef = ref(storage, fileName);

        await uploadBytes(storageRef, newAvatarFile);
        avatarUrl = await getDownloadURL(storageRef);
        profileUpdates.photoURL = avatarUrl;
      }

      // Mise à jour du profil auth
      await updateProfile(auth.currentUser, profileUpdates);
    }

    // Mise à jour du document Firestore
    const userData = { ...otherData };
    if (avatarUrl) {
      userData.avatarUrl = avatarUrl;
    }

    await updateDoc(userRef, userData);
    toast.success('Mise à jour réussie !');
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    toast.error('Une erreur est survenue lors de la mise à jour');
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
