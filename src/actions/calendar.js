import { useMemo, useState, useEffect } from 'react';
import {
  query,
  addDoc,
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
    // Récupérer l'utilisateur connecté
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user found');
    }

    const eventsRef = collection(db, 'calendar-events');

    // Préparer les données avec les informations supplémentaires
    const { id, ...dataToSave } = eventData;
    const enrichedData = {
      ...dataToSave,
      userId: user.uid,
      userDisplayName: user.displayName || 'Anonymous',
      createdAt: Date.now(), // Utilisation du serverTimestamp pour la cohérence
    };

    // Créer le document
    const docRef = await addDoc(eventsRef, enrichedData);

    // Retourner les données avec l'ID
    return {
      ...enrichedData,
      id: docRef.id,
      createdAt: new Date(), // On retourne une date JavaScript car serverTimestamp n'est pas encore résolu
    };

  } catch (error) {
    console.error("Error creating event: ", error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function updateEvent(eventData) {
  try {
    const { id, ...dataToUpdate } = eventData;

    if (!id) {
      throw new Error("Event ID is missing");
    }

    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user found');
    }

    // Enrichir les données avec les informations de mise à jour
    const enrichedData = {
      ...dataToUpdate,
      userId: user.uid,
      userDisplayName: user.displayName || 'Anonymous',
      updatedAt: Date.now(),
    };

    const eventRef = firestoreDoc(db, 'calendar-events', id);
    await updateDoc(eventRef, enrichedData);

    // Retourner les données mises à jour avec l'ID
    return {
      ...enrichedData,
      id,
      updatedAt: new Date(), // On retourne une date JavaScript car serverTimestamp n'est pas encore résolu
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
    const eventRef = firestoreDoc(db, 'calendar-events', eventId);
    await deleteDoc(eventRef);
  } catch (error) {
    console.error("Error deleting event: ", error);
    throw error;
  }
}
