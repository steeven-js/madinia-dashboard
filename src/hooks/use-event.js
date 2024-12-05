// src/services/events.js
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { doc, query, limit, setDoc, orderBy, getDocs, updateDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';

import { db } from 'src/utils/firebase';

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

// Supprimer une facture
export async function deleteEvent(eventId) {
  try {
    const eventRef = doc(db, 'events', eventId);
    await deleteDoc(eventRef);
    toast.success('Event deleted');
    return { success: true };
  } catch (error) {
    console.error('Error deleting event:', error);
    toast.error(error.message || 'Operation failed');
    return { success: false, error: error.message };
  }
}

// Obtenir le dernier eventNumber pour la création d'une nouvelle facture
export function useNextEventNumber() {
  const [nextNumber, setNextNumber] = useState('');

  useEffect(() => {
    async function getNextNumber() {
      try {
        const eventsRef = collection(db, 'events');
        const q = query(eventsRef, orderBy('eventNumber', 'desc'), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setNextNumber('INV-0001');
          return;
        }

        const lastEventNumber = snapshot.docs[0].data().eventNumber;
        const numPart = parseInt(lastEventNumber.split('-')[1], 10);
        setNextNumber(`INV-${(numPart + 1).toString().padStart(4, '0')}`);
      } catch (error) {
        console.error('Error getting next event number:', error);
        setNextNumber('INV-0001');
      }
    }

    getNextNumber();
  }, []);

  return nextNumber;
}

// Custom hook pour obtenir les services pour la création d'une facture
export function useEventsServices() {
  const [eventsServices, setEventsServices] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let unsubscribe = () => {};

    const fetchServices = async () => {
      setLoading(true);
      const eventsServicesRef = collection(db, 'services');

      unsubscribe = onSnapshot(
        eventsServicesRef,
        (snapshot) => {
          const fetchedEventsServices = snapshot.docs.map((docSnapshot) => ({
            id: docSnapshot.id,
            ...docSnapshot.data(),
          }));
          setEventsServices(fetchedEventsServices);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching eventsServices:', error);
          setLoading(false);
        }
      );
    };

    fetchServices();

    // Cleanup function
    return () => unsubscribe();
  }, []);

  return { eventsServices, loading };
}
