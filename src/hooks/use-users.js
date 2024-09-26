import { updateProfile } from 'firebase/auth';
import { useState, useEffect, useCallback } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, updateDoc, onSnapshot, collection } from 'firebase/firestore';

import { db, auth, storage } from 'src/utils/firebase';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------
// All Users

export function useUsersData() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};

    setLoading(true);
    const usersRef = collection(db, 'users');

    unsubscribe = onSnapshot(
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

  const _updateUsers = useCallback((newUsers) => {
    setUsers(newUsers);
  }, []);

  return { users, loading, _updateUsers };
}

// ----------------------------------------------------------------------
// User by ID

export function useUserById(_userId) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};

    if (_userId) {
      setLoading(true);
      const userDocRef = doc(db, 'users', _userId);

      unsubscribe = onSnapshot(
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
    } else {
      setUser(null);
      setLoading(false);
    }

    return () => unsubscribe();
  }, [_userId]);

  return { user, loading };
}

// ----------------------------------------------------------------------
// User by Email

export async function updateUsers({ currentUser, data }) {
  // Destructure the data object to extract avatarUrl and other data
  const { avatarUrl: initialAvatarUrl, ...otherData } = data;

  let avatarUrl = initialAvatarUrl;

  // Ensure a user ID is available
  const userId = currentUser?.uid || currentUser?.id;
  // console.log('userId', userId);

  // Référence à la collection 'users' dans Firestore
  const usersRef = collection(db, 'users');

  // Check if a new avatar file has been provided
  if (initialAvatarUrl instanceof File) {
    // Create a fixed filename for the avatar
    const fileExtension = initialAvatarUrl.name.split('.').pop();
    const fileName = `avatars/${userId}/avatar.${fileExtension}`;

    // Reference to the file in Firebase storage
    const storageRef = ref(storage, fileName);

    try {
      // Upload the new avatar file to Firebase storage, replacing the old one if it exists
      await uploadBytes(storageRef, initialAvatarUrl);

      // Get the download URL of the new avatar file
      avatarUrl = await getDownloadURL(storageRef);

      // Update the auth photoURL if the user is authenticated
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          photoURL: avatarUrl,
        });
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      throw error;
    }
  }

  // Create a user data object with the updated avatar URL
  const userData = {
    ...otherData,
    avatarUrl,
  };

  try {
    // Crée une référence de document pour un nouvel utilisateur ou un utilisateur existant
    const userRef = userId ? doc(usersRef, userId) : doc(usersRef);

    // Met à jour ou crée les données utilisateur dans Firestore
    if (userId) {
      await updateDoc(userRef, userData);
      toast.success('Mise à jour réussie !');
    } else {
      await setDoc(userRef, userData);
      toast.success('Création réussie !');
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour/création de l\'utilisateur:', error);
    toast.error('Une erreur est survenue lors de l\'opération');
  }
}

export async function updateFastUsers({ currentUser, data }) {
  // Crée un objet de données utilisateur
  const userData = { ...data };

  // Référence à la collection 'users' dans Firestore
  const usersRef = collection(db, 'users');

  try {
    // Crée une référence de document pour un nouvel utilisateur ou un utilisateur existant
    const userRef = currentUser?.id ? doc(usersRef, currentUser.id) : doc(usersRef);

    // Met à jour ou crée les données utilisateur dans Firestore
    if (currentUser?.id) {
      await updateDoc(userRef, userData);
      toast.success('Mise à jour réussie !');
    } else {
      await setDoc(userRef, userData);
      toast.success('Création réussie !');
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour/création de l\'utilisateur:', error);
    toast.error('Une erreur est survenue lors de l\'opération');
  }
}
