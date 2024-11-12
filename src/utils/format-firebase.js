// src/utils/format-firebase.js
import { fDateTime } from './format-time';

export const formatFirebaseTimestamp = (timestamp) => {
  if (!timestamp) return null;

  // Si c'est un Timestamp Firebase
  if (timestamp?.seconds) {
    return {
      // Garder les valeurs originales pour référence
      seconds: timestamp.seconds,
      nanoseconds: timestamp.nanoseconds,
      // Convertir en format ISO pour la sérialisation
      formatted: fDateTime(timestamp.toDate()),
      // Timestamp unix en millisecondes
      timestamp: timestamp.toDate().getTime(),
    };
  }

  return timestamp;
};
