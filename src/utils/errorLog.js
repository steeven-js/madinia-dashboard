// Fonction utilitaire pour nettoyer les données sensibles
export const sanitizeErrorForLogging = (error) => {
  if (error?.config) {
    // Créer une copie profonde de l'erreur pour ne pas modifier l'original
    const sanitizedError = JSON.parse(JSON.stringify(error));

    // Masquer le bearer token
    if (sanitizedError.config.headers?.Authorization) {
      sanitizedError.config.headers.Authorization = 'Bearer [HIDDEN]';
    }

    // Si nécessaire, masquer d'autres données sensibles ici

    return sanitizedError;
  }
  return error;
};
// ----------------------------------------------------------------------
