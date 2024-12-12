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
    let unsubscribe = () => { };

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
        // console.error('Error fetching events:', error);
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
        // console.error('Error fetching event:', _error);
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
 * Crée ou met à jour un événement dans Firebase, SQL et Stripe
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
    const shouldStoreInSQL = data.price != null && data.price > 0;

    // Préparation des données pour Firebase et SQL selon le modèle Laravel
    const sqlEventData = {
      firebaseId: '', // Sera défini plus tard
      title: data.title,
      scheduled_date: data.isScheduledDate ? data.scheduledDate : data.date,
      status: data.status,
      is_active: !data.isScheduledDate && (data.status !== 'draft' && data.status !== 'pending'),
    };

    const config = {
      headers: CONFIG.headers
    };

    let response = null;
    let firebaseId;
    let stripeData = null;

    if (currentEvent) {
      // Mise à jour Firebase
      firebaseId = currentEvent.id;
      sqlEventData.firebaseId = firebaseId;

      if (shouldStoreInSQL) {
        // L'événement doit être stocké en SQL (payant)

        // 1. Gestion Stripe
        if (currentEvent.stripeEventId) {
          // Déjà payant : mise à jour Stripe
          stripeData = await axios.put(
            `${ENDPOINTS.API_STRIPE_EVENT_URL}/update-event/${currentEvent.stripeEventId}`,
            {
              name: data.title,
              price: data.price
            },
            config
          );
        } else {
          // Était gratuit : création dans Stripe
          stripeData = await axios.post(
            `${ENDPOINTS.API_STRIPE_EVENT_URL}/create-event`,
            {
              name: data.title,
              price: data.price
            },
            config
          );

          // Mise à jour des données avec les IDs Stripe
          data.stripeEventId = stripeData.data.id;
          data.stripePriceId = stripeData.data.price_id;
        }

        // 2. Mise à jour Firebase avec toutes les données
        await updateDoc(doc(db, 'events', currentEvent.id), data);

        // 3. Vérification de l'existence en SQL
        const eventResponse = await axios.get(
          `${ENDPOINTS.API_EVENT_URL}/${firebaseId}`,
          config
        );

        if (eventResponse.data.exists) {
          // L'événement existe, mise à jour
          response = await axios.put(
            `${ENDPOINTS.API_EVENT_URL}/${firebaseId}`,
            {
              ...sqlEventData,
              stripe_event_id: stripeData.data.id,
              stripe_price_id: stripeData.data.price_id,
            },
            config
          );

          if (!response.data.exists) {
            // L'événement a été supprimé entre temps, on le crée
            response = await axios.post(
              ENDPOINTS.API_EVENT_URL,
              {
                ...sqlEventData,
                stripe_event_id: stripeData.data.id,
                stripe_price_id: stripeData.data.price_id,
              },
              config
            );
          }
        } else {
          // L'événement n'existe pas, création
          response = await axios.post(
            ENDPOINTS.API_EVENT_URL,
            {
              ...sqlEventData,
              stripe_event_id: stripeData.data.id,
              stripe_price_id: stripeData.data.price_id,
            },
            config
          );
        }
      } else if (currentEvent.price > 0) {
        // Si l'événement était payant avant et ne l'est plus
        if (currentEvent.stripeEventId) {
          await axios.delete(
            `${ENDPOINTS.API_STRIPE_EVENT_URL}/delete-event/${currentEvent.stripeEventId}`,
            config
          );
        }

        const eventResponse = await axios.get(
          `${ENDPOINTS.API_EVENT_URL}/${firebaseId}`,
          config
        );

        if (eventResponse.data.exists) {
          await axios.delete(`${ENDPOINTS.API_EVENT_URL}/${firebaseId}`, config);
        }

        // Nettoyer les données Stripe dans l'objet avant la mise à jour Firebase
        data.stripeEventId = null;
        data.stripePriceId = null;
        await updateDoc(doc(db, 'events', currentEvent.id), data);
      } else {
        // Mise à jour simple Firebase sans Stripe/SQL
        await updateDoc(doc(db, 'events', currentEvent.id), data);
      }
    } else {
      // Création d'un nouvel événement
      const newDocRef = doc(collection(db, 'events'));
      firebaseId = newDocRef.id;
      sqlEventData.firebaseId = firebaseId;

      if (shouldStoreInSQL) {
        // Création Stripe
        stripeData = await axios.post(
          `${ENDPOINTS.API_STRIPE_EVENT_URL}/create-event`,
          {
            name: data.title,
            price: data.price
          },
          config
        );

        // Création dans Firebase avec les IDs Stripe
        await setDoc(newDocRef, {
          ...data,
          id: firebaseId,
          stripeEventId: stripeData.data.id,
          stripePriceId: stripeData.data.price_id
        });

        // Création dans SQL
        response = await axios.post(
          ENDPOINTS.API_EVENT_URL,
          {
            ...sqlEventData,
            stripe_event_id: stripeData.data.id,
            stripe_price_id: stripeData.data.price_id,
          },
          config
        );
      } else {
        // Création dans Firebase uniquement
        await setDoc(newDocRef, { ...data, id: firebaseId });
      }
    }

    return {
      success: !shouldStoreInSQL || (response && (response.status === 201 || response.status === 200)),
      data: response?.data?.data || null,
      firebaseId,
      stripeData: stripeData?.data || null,
      message: currentEvent ? 'Événement mis à jour!' : 'Événement créé!'
    };

  } catch (error) {
    // console.error('Erreur lors de la sauvegarde:', error);
    toast.error(error.response?.data?.message || 'Échec de la sauvegarde');
    return {
      success: false,
      error: error.response?.data?.message || 'Échec de la sauvegarde',
      firebaseId: null,
      data: null,
      stripeData: null
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
    // Get event data to check if it exists in SQL
    const eventRef = doc(db, 'events', eventId);
    const eventSnap = await eventRef.get();
    const event = eventSnap.exists() ? eventSnap.data() : null;

    // If event has Stripe data, delete from SQL
    if (event?.stripeEventId) {
      const config = {
        headers: CONFIG.headers
      };

      try {
        // Delete from Stripe first
        await axios.delete(
          `${ENDPOINTS.API_STRIPE_EVENT_URL}/delete-event/${event.stripeEventId}`,
          config
        );

        // Then delete from SQL
        await axios.delete(`${ENDPOINTS.API_EVENT_URL}/${eventId}`, config);
      } catch (sqlError) {
        // console.error('Error deleting from SQL/Stripe:', sqlError);
        // Continue with Firebase deletion even if SQL/Stripe deletion fails
      }
    }

    // Delete from Firebase
    await deleteDoc(eventRef);

    // Delete images from Storage
    const storageRef = ref(storage, `events/${eventId}`);
    const filesList = await listAll(storageRef);

    // Delete all files in the folder
    await Promise.all(
      filesList.items.map(fileRef => deleteObject(fileRef))
    );

    toast.success('Event deleted');
    return { success: true };

  } catch (error) {
    // console.error('Error deleting event:', error);
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
    // console.error('Error uploading image:', error);
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
    // console.error('Error deleting image:', error);
    toast.error(error.message || 'Operation failed');
    throw error;
  }
};
