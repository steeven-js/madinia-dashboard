import { updateProfile } from 'firebase/auth';
import { useState, useEffect, useCallback } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, onSnapshot, collection } from 'firebase/firestore';

import { db, auth, storage } from 'src/utils/firebase';

import { toast } from 'src/components/snackbar';

const getCurrentUserUid = () => auth.currentUser?.uid;

export const useUsersData = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const fetchedUsers = snapshot.docs.map((docSnapshot) => ({
          uid: docSnapshot.id,
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

export const useUserById = (uid) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setUser(null);
      setLoading(false);
      // Return a no-op cleanup function
      return () => {};
    }

    const userDocRef = doc(db, 'users', uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setUser({ uid: docSnapshot.id, ...docSnapshot.data() });
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
  }, [uid]);

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

  if (newAvatarFile instanceof File) {
    const fileExtension = newAvatarFile.name.split('.').pop();
    const fileName = `avatars/${uid}/avatar.${fileExtension}`;
    const storageRef = ref(storage, fileName);

    try {
      await uploadBytes(storageRef, newAvatarFile);
      avatarUrl = await getDownloadURL(storageRef);

      await updateProfile(auth.currentUser, { photoURL: avatarUrl });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      throw error;
    }
  }

  const userData = { ...otherData, avatarUrl };

  try {
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
