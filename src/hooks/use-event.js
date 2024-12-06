// src/services/events.js
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { doc, setDoc, updateDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';

import { db, storage } from 'src/utils/firebase';

// Obtenir la liste des factures
export function useEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let unsubscribe = () => {};

    setLoading(true);
    const eventsRef = collection(db, 'events');

    unsubscribe = onSnapshot(
      eventsRef,
      (snapshot) => {
        const fetchedEvents = snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        }));
        setEvents(fetchedEvents);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching events:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

return { events, loading };
}

// Obtenir une facture par son ID
export function useEventById(eventId) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!eventId) {
      setEvent(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const eventRef = doc(db, 'events', eventId);
    const unsubscribe = onSnapshot(
          eventRef,
          (docSnapshot) => {
            if (docSnapshot.exists()) {
              setEvent({ id: docSnapshot.id, ...docSnapshot.data() });
              setLoading(false);
            } else {
              setError('Event not found');
              setLoading(false);
            }
          },
          (_error) => {
            console.error('Error fetching event:', _error);
            setError(_error.message);
            setLoading(false);
          }
        );

        // eslint-disable-next-line consistent-return
        return () => unsubscribe();
      }, [eventId]);

      return { event, loading, error };
}

// Créer/mettre à jour une facture
export async function createOrUpdateEvent(event, eventId) {
  try {
    if (!eventId) {
      const eventRef = doc(collection(db, 'events'));
      await setDoc(eventRef, {
        ...event,
        createdAt: Date.now(),
      });
      toast.success('Event created');
      return {success: true, data: { id: eventRef.id, ...event }};
    }

    const eventRef = doc(db, 'events', eventId);
    await updateDoc(eventRef, event);
    toast.success('Event updated');
    return { success: true, data: { id: eventId, ...event }};
  } catch (error) {
    console.error('Error managing customer:', error);
    toast.error(error.message || 'Operation failed');
    return { success: false, error: error.message };
  }
}

export async function deleteEvent(eventId) {
  try {
   // Supprimer le document
   const eventRef = doc(db, 'events', eventId);
   await deleteDoc(eventRef);

   // Supprimer le dossier d'images dans Storage
   const storageRef = ref(storage, `events/${eventId}`);
   const filesList = await listAll(storageRef);

   // Supprimer tous les fichiers du dossier
   await Promise.all(
     filesList.items.map(fileRef => deleteObject(fileRef))
   );

   toast.success('Event deleted');
   return { success: true };

 } catch (error) {
   console.error('Error deleting event:', error);
   toast.error(error.message || 'Operation failed');
   return { success: false, error: error.message };
 }
}

export const uploadImage = async (file) => {
  try {
    const storageRef = ref(storage, `events/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};
