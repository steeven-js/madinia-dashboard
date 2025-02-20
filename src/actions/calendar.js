import { useMemo, useState, useEffect } from 'react';
import {
  query,
  addDoc,
  getDoc,
  orderBy,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  getFirestore,
  doc as firestoreDoc,
} from 'firebase/firestore';

import { auth } from 'src/utils/firebase';

const db = getFirestore();

// ----------------------------------------------------------------------

export function useGetEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const eventsRef = collection(db, 'calendar-events');
    const q = query(eventsRef, orderBy('start'));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const fetchedEvents = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          textColor: doc.data().color // Ensure the color is set as textColor
        }));
        setEvents(fetchedEvents);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const memoizedValue = useMemo(() => ({
    events: events || [],
    eventsLoading: loading,
    eventsError: error,
    eventsValidating: false,
    eventsEmpty: !loading && events.length === 0,
  }), [events, loading, error]);

  return memoizedValue;
}

// ----------------------------------------------------------------------

export async function createEvent(eventData) {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user found');
    }

    const eventsRef = collection(db, 'calendar-events');

    const { id, ...dataToSave } = eventData;
    const enrichedData = {
      ...dataToSave,
      userId: user.uid,
      userDisplayName: user.displayName || 'Anonymous',
      photoURL: user.photoURL || '',
      userEmail: user.email,
      createdAt: Date.now(),
    };

    const docRef = await addDoc(eventsRef, enrichedData);

    return {
      ...enrichedData,
      id: docRef.id,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error("Error creating event: ", error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function updateEvent(eventData) {
  try {
    // On extrait les informations de l'utilisateur créateur pour les préserver
    const {
      id,
      userId,
      userDisplayName,
      photoURL,
      userEmail,
      createdAt,
      ...dataToUpdate
    } = eventData;

    if (!id) {
      throw new Error("Event ID is missing");
    }

    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user found');
    }

    // On préserve les informations de l'utilisateur créateur
    const enrichedData = {
      ...dataToUpdate,
      // On garde les informations originales du créateur
      userId,
      userDisplayName,
      photoURL,
      userEmail,
      createdAt,
      // On ajoute les informations de modification
      updatedAt: Date.now(),
      lastModifiedBy: user.uid,
      lastModifiedByName: user.displayName || 'Anonymous',
    };

    const eventRef = firestoreDoc(db, 'calendar-events', id);
    await updateDoc(eventRef, enrichedData);

    return {
      ...eventData,
      ...enrichedData,
      id,
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error("Error updating event: ", error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function deleteEvent(eventId) {
  try {
    if (!eventId) {
      throw new Error("Event ID is missing");
    }

    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user found');
    }

    // Récupérer l'événement pour vérifier les permissions
    const eventRef = firestoreDoc(db, 'calendar-events', eventId);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists()) {
      throw new Error('Event not found');
    }

    const eventData = eventDoc.data();

    // Vérifier si l'utilisateur est le créateur ou un admin
    const isAdmin = user.role === 'dev';
    const isCreator = eventData.userId === user.uid;

    if (!isAdmin && !isCreator) {
      throw new Error('Unauthorized: You do not have permission to delete this event');
    }

    await deleteDoc(eventRef);
  } catch (error) {
    console.error("Error deleting event: ", error);
    throw error;
  }
}
