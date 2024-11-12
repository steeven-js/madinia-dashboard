import { useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile, updatePassword, onAuthStateChanged } from 'firebase/auth';

import { db, auth } from 'src/utils/firebase';

import { setUser, setRole, setError, clearAuth } from 'src/store/slices/authSlice';

export function useAuth() {
  const dispatch = useDispatch();
  const [user, setLocalUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Helper function to serialize timestamps
    const serializeTimestamp = (timestamp) => {
      if (!timestamp) return null;
      // If it's a Firestore Timestamp, convert to milliseconds
      if (timestamp?.toMillis) {
        return timestamp.toMillis();
      }
      // If it's already a Date object, convert to milliseconds
      if (timestamp instanceof Date) {
        return timestamp.getTime();
      }
      // If it's already a number (milliseconds), return as is
      if (typeof timestamp === 'number') {
        return timestamp;
      }
      return null;
    };

    // Helper function to serialize the entire user profile
    const serializeProfile = (profile) => {
      if (!profile) return null;

      const serialized = { ...profile };

      // Convert any timestamp fields to milliseconds
      if (profile.createdAt) {
        serialized.createdAt = serializeTimestamp(profile.createdAt);
      }
      if (profile.updatedAt) {
        serialized.updatedAt = serializeTimestamp(profile.updatedAt);
      }
      if (profile.lastConnection) {
        serialized.lastConnection = serializeTimestamp(profile.lastConnection);
      }

      return serialized;
    };

    const unsubscribe = onAuthStateChanged(auth, async (_user) => {
      if (_user) {
        setLocalUser(_user);
        setUserId(_user.uid);

        try {
          const userProfileDoc = await getDoc(doc(db, 'users', _user.uid));
          if (userProfileDoc.exists()) {
            const profileData = userProfileDoc.data();
            setUserProfile(profileData);

            // Serialize the user data before dispatching to Redux
            const serializedUserData = {
              id: _user.uid,
              email: _user.email,
              createdAt: serializeTimestamp(_user.metadata.creationTime),
              lastConnection: serializeTimestamp(_user.metadata.lastSignInTime),
              ...serializeProfile(profileData)
            };

            // Dispatch serialized user data to Redux
            dispatch(setUser(serializedUserData));

            // Dispatch role to Redux
            dispatch(setRole(profileData?.role || 'user'));
          } else {
            console.log("Le profil utilisateur n'existe pas");
            dispatch(clearAuth());
          }
        } catch (error) {
          console.error('Erreur lors de la récupération du profil utilisateur:', error);
          dispatch(setError(error.message));
        }
      } else {
        setLocalUser(null);
        setUserId(null);
        setUserProfile(null);
        dispatch(clearAuth());
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [dispatch]);

  return { user, userId, userProfile, loading };
}

export function useUpdateUserProfile() {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setUpdateError] = useState(null);

  const updateUserProfile = async (newData) => {
    if (!user) {
      setUpdateError('User not authenticated');
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);

    try {
      // Update Firebase Auth user profile
      const authUpdateData = {};
      if (newData.displayName) authUpdateData.displayName = newData.displayName;
      if (newData.photoUrl) authUpdateData.photoUrl = newData.photoUrl;

      if (Object.keys(authUpdateData).length > 0) {
        await updateProfile(auth.currentUser, authUpdateData);
      }

      // Update Firestore user profile
      const userProfileRef = doc(db, 'users', user.uid);
      await updateDoc(userProfileRef, newData);

      // You might want to refresh the userProfile state here
      // This depends on how you've set up your useAuth hook
      // For example, you could add a refreshUserProfile function to useAuth
    } catch (err) {
      setUpdateError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateUserProfile, isUpdating, error };
}

// UpdateFirebasePassword de l'utilisateur connecté
export function useUpdateFirebasePassword() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setFirebaseError] = useState(null);

  const updateFirebasePassword = async (newPassword) => {
    setIsUpdating(true);
    setFirebaseError(null);

    try {
      await updatePassword(auth.currentUser, newPassword);
    } catch (err) {
      setFirebaseError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateFirebasePassword, isUpdating, error };
}
