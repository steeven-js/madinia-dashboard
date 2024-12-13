// src/services/events.js
import axios from 'axios';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { ref, listAll, uploadBytes, deleteObject, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';

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
 * @returns {Promise<Object>} Résultat de l'opération
 */
export const handleEventSubmit = async (data, currentEvent = null) => {
  try {
    // Configuration de base
    const config = { headers: CONFIG.headers };
    const shouldStoreInSQL = data.price != null && data.price > 0;
    let response = null;
    let firebaseId;
    let stripeData = null;

    // Préparation des données SQL de base
    const sqlEventData = {
      firebaseId: '',
      title: data.title,
      image_url: data.image,
      price: data.price,
      scheduled_date: data.isScheduledDate ? data.scheduledDate : data.date,
      status: data.status,
      is_active: !data.isScheduledDate && (data.status !== 'draft' && data.status !== 'pending'),
    };

    // Fonction utilitaire pour gérer les opérations Stripe
    const handleStripeOperation = async (isUpdate = false, stripeEventId = null) => {
      // Validation de l'image
      if (!data.image) {
        console.warn('No image URL provided for Stripe product');
      }

      // Détermination de l'endpoint et de la méthode
      const endpoint = isUpdate
        ? `${ENDPOINTS.API_STRIPE_EVENT_URL}/update-event/${stripeEventId}`
        : `${ENDPOINTS.API_STRIPE_EVENT_URL}/create-event`;

      const method = isUpdate ? 'put' : 'post';

      // Préparation du payload Stripe
      const payload = {
        title: data.title,
        price: data.price,
        imageUrl: data.image
      };

      console.log('Stripe operation:', { isUpdate, endpoint, payload });

      // Appel à l'API Stripe
      const stripeResponse = await axios[method](endpoint, payload, config);

      // Validation de la réponse
      if (!stripeResponse.data?.id) {
        throw new Error('Invalid Stripe response format');
      }

      // Vérification de l'image
      const verificationResponse = await axios.get(
        `${ENDPOINTS.API_STRIPE_EVENT_URL}/get-event/${stripeResponse.data.id}`,
        config
      );

      // Mise à jour de l'image si nécessaire
      if (!verificationResponse.data?.images?.includes(data.image)) {
        console.warn('Image URL verification failed:', {
          provided: data.image,
          received: verificationResponse.data?.images
        });

        await axios.post(
          `${ENDPOINTS.API_STRIPE_EVENT_URL}/update-image/${stripeResponse.data.id}`,
          { imageUrl: data.image },
          config
        );
      }

      return stripeResponse;
    };

    // CAS 1: Mise à jour d'un événement existant
    if (currentEvent) {
      firebaseId = currentEvent.id;
      sqlEventData.firebaseId = firebaseId;

      // CAS 1.1: Événement payant (nouveau ou existant)
      if (shouldStoreInSQL) {
        try {
          // Gestion Stripe
          stripeData = await handleStripeOperation(
            !!currentEvent.stripeEventId,
            currentEvent.stripeEventId
          );

          if (!stripeData?.data) {
            throw new Error('Erreur lors de l\'opération Stripe');
          }

          // Mise à jour des IDs Stripe dans Firebase
          const stripeIds = {
            stripeEventId: stripeData.data.id,
            stripePriceId: stripeData.data.price_id,
            image: data.image
          };

          // Mise à jour Firebase
          await updateDoc(doc(db, 'events', currentEvent.id), {
            ...data,
            ...stripeIds
          });

          // Vérification et mise à jour SQL
          const eventResponse = await axios.get(
            `${ENDPOINTS.API_EVENT_URL}/${firebaseId}`,
            config
          );

          // Préparation du payload SQL complet
          const sqlPayload = {
            ...sqlEventData,
            stripe_event_id: stripeData.data.id,
            stripe_price_id: stripeData.data.price_id,
            scheduled_date: data.isScheduledDate ? data.scheduledDate : data.date,
            title: data.title,
            price: data.price,
            image_url: data.image,
            status: data.status,
            is_active: !data.isScheduledDate && (data.status !== 'draft' && data.status !== 'pending')
          };

          // Mise à jour ou création SQL selon l'existence
          if (eventResponse.data.exists) {
            response = await axios.put(
              `${ENDPOINTS.API_EVENT_URL}/${firebaseId}`,
              sqlPayload,
              config
            );

            if (!response.data.exists) {
              response = await axios.post(ENDPOINTS.API_EVENT_URL, sqlPayload, config);
            }
          } else {
            response = await axios.post(ENDPOINTS.API_EVENT_URL, sqlPayload, config);
          }
        } catch (error) {
          throw new Error(`Erreur lors de la mise à jour de l'événement payant: ${error.message}`);
        }
      }
      // CAS 1.2: Conversion d'un événement payant en gratuit
      else if (currentEvent.price > 0) {
        try {
          // Suppression des données Stripe si elles existent
          if (currentEvent.stripeEventId) {
            await axios.delete(
              `${ENDPOINTS.API_STRIPE_EVENT_URL}/delete-event/${currentEvent.stripeEventId}`,
              config
            );
          }

          // Suppression des données SQL
          const eventResponse = await axios.get(
            `${ENDPOINTS.API_EVENT_URL}/${firebaseId}`,
            config
          );

          if (eventResponse.data.exists) {
            await axios.delete(`${ENDPOINTS.API_EVENT_URL}/${firebaseId}`, config);
          }

          // Mise à jour Firebase sans les données Stripe
          await updateDoc(doc(db, 'events', currentEvent.id), {
            ...data,
            stripeEventId: null,
            stripePriceId: null
          });
        } catch (error) {
          throw new Error(`Erreur lors de la conversion en événement gratuit: ${error.message}`);
        }
      }
      // CAS 1.3: Mise à jour d'un événement gratuit
      else {
        await updateDoc(doc(db, 'events', currentEvent.id), data);
      }
    }
    // CAS 2: Création d'un nouvel événement
    else {
      const newDocRef = doc(collection(db, 'events'));
      firebaseId = newDocRef.id;
      sqlEventData.firebaseId = firebaseId;

      // CAS 2.1: Création d'un événement payant
      if (shouldStoreInSQL) {
        try {
          // Création dans Stripe
          stripeData = await handleStripeOperation();

          if (!stripeData?.data) {
            throw new Error('Erreur lors de la création Stripe');
          }

          const stripeIds = {
            stripeEventId: stripeData.data.id,
            stripePriceId: stripeData.data.price_id
          };

          // Création dans Firebase avec les données Stripe
          await setDoc(newDocRef, {
            ...data,
            id: firebaseId,
            ...stripeIds,
            image: data.image
          });

          // Création dans SQL
          response = await axios.post(
            ENDPOINTS.API_EVENT_URL,
            {
              ...sqlEventData,
              stripe_event_id: stripeData.data.id,
              stripe_price_id: stripeData.data.price_id,
              image_url: data.image
            },
            config
          );
        } catch (error) {
          throw new Error(`Erreur lors de la création de l'événement payant: ${error.message}`);
        }
      }
      // CAS 2.2: Création d'un événement gratuit
      else {
        await setDoc(newDocRef, {
          ...data,
          id: firebaseId,
          image: data.image
        });
      }
    }

    // Notification de succès
    toast.success(currentEvent ? 'Événement mis à jour!' : 'Événement créé!');

    // Retour des données
    return {
      success: true,
      data: response?.data?.data || null,
      firebaseId,
      stripeData: stripeData?.data || null,
      message: currentEvent ? 'Événement mis à jour!' : 'Événement créé!'
    };

  } catch (error) {
    // Gestion des erreurs
    console.error('Error details:', error.response?.data || error);
    let errorMessage = 'Échec de la sauvegarde';

    // Erreurs de validation
    if (error.response?.status === 422) {
      const validationErrors = error.response.data.errors;
      console.log('Validation errors:', validationErrors);
      errorMessage = Object.entries(validationErrors)
        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
        .join('\n');
    } else {
      errorMessage = error.response?.data?.message || error.message;
    }

    // Notification d'erreur
    toast.error(errorMessage);
    throw error;
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
    const eventSnap = await getDoc(eventRef); // Correction ici : utiliser getDoc au lieu de get()
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
        console.error('Error deleting from SQL/Stripe:', sqlError);
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
    // console.error('Error uploading image:', error);
    toast.error(error.message || 'Operation failed');
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
