// src/services/events.js
import axios from 'axios';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { ref, listAll, uploadBytes, deleteObject, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, updateDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';

import { db, storage } from 'src/utils/firebase';

import { CONFIG, ENDPOINTS } from 'src/config-global';

/**
 * Hook pour récupérer la liste des événements depuis Firebase
 * @returns {Object} Un objet contenant:
 * - events: La liste des événements
 * - loading: L'état de chargement
 */
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

/**
 * Hook pour récupérer un événement spécifique par son ID
 * @param {string} eventId - L'ID de l'événement à récupérer
 * @returns {Object} Un objet contenant:
 * - event: Les données de l'événement
 * - loading: L'état de chargement
 * - error: Les erreurs éventuelles
 */
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

/**
 * Crée ou met à jour un événement dans Firebase et SQL
 * @param {Object} data - Les données de l'événement
 * @param {Object|null} currentEvent - L'événement existant si c'est une mise à jour
 * @returns {Promise<Object>} Un objet contenant:
 * - success: boolean indiquant si l'opération a réussi
 * - data: Les données retournées par l'API
 * - firebaseId: L'ID Firebase de l'événement
 * - message: Message de succès
 * - error: Message d'erreur (si échec)
 */
export const handleEventSubmit = async (data, currentEvent = null) => {
  try {
    // Préparation des données pour Firebase et SQL
    const eventData = {
      title: data.title,
      scheduled_date: data.isScheduledDate ? data.scheduledDate : data.date,
      is_active: !data.isScheduledDate && (data.status !== 'draft' && data.status !== 'pending'),
      status: data.status,
    };

    // Configuration pour Axios
    const config = {
      headers: CONFIG.headers
    };

    let response;
    let firebaseId;

    // Gestion Firebase
    if (currentEvent) {
      // Mise à jour Firebase
      await updateDoc(doc(db, 'events', currentEvent.id), data);
      firebaseId = currentEvent.id;

      // Mise à jour SQL via API
      response = await axios.put(
        `${ENDPOINTS.API_EVENT_URL}/${firebaseId}`,
        eventData,
        config
      );
    } else {
      // Création dans Firebase
      const newDocRef = doc(collection(db, 'events'));
      firebaseId = newDocRef.id;
      await setDoc(newDocRef, { ...data, id: firebaseId });

      // Création dans SQL via API
      response = await axios.post(
        ENDPOINTS.API_EVENT_URL,
        {
          ...eventData,
          firebaseId
        },
        config
      );
    }

    return {
      success: response.status === 201 || response.status === 200,
      data: response.data,
      firebaseId,
      message: currentEvent ? 'Événement mis à jour!' : 'Événement créé!'
    };

  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    toast.error(error.response?.data?.message || 'Échec de la sauvegarde');
    return {
      success: false,
      error: error.response?.data?.message || 'Échec de la sauvegarde',
      firebaseId: null,
      data: null
    };
  }
};

/**
 * Supprime un événement et ses images associées
 * @param {string} eventId - L'ID de l'événement à supprimer
 * @returns {Promise<Object>} Un objet contenant:
 * - success: boolean indiquant si la suppression a réussi
 * - error: Message d'erreur (si échec)
 */
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

/**
 * Upload une image dans Firebase Storage
 * @param {File} file - Le fichier image à uploader
 * @returns {Promise<string>} L'URL de téléchargement de l'image
 * @throws {Error} Si l'upload échoue
 */
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

/**
 * Supprime une image spécifique d'un événement
 * @param {string} imageUrl - L'URL de l'image à supprimer
 * @returns {Promise<Object>} Un objet indiquant le succès ou l'échec
 */
export const deleteEventImage = async (imageUrl) => {
  try {
    if (!imageUrl) {
      throw new Error('URL de l\'image non fournie');
    }

    // Créer une référence à partir de l'URL complète
    const imageRef = ref(storage, imageUrl);

    // Supprimer le fichier
    await deleteObject(imageRef);

    return {
      success: true,
      message: 'Image supprimée avec succès'
    };
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};
