// Fonction pour formater la taille des fichiers
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / (k ** i)).toFixed(2))} ${sizes[i]}`;
};

// Fonction pour formater les dates
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

// Fonction pour déterminer l'icône de fichier en fonction du type MIME
export const getFileIcon = (contentType) => {
  if (!contentType) return 'eva:file-outline';

  if (contentType.startsWith('image/')) return 'eva:image-outline';
  if (contentType.startsWith('video/')) return 'eva:video-outline';
  if (contentType.startsWith('audio/')) return 'eva:music-outline';
  if (contentType.includes('pdf')) return 'eva:file-text-outline';
  if (contentType.includes('word') || contentType.includes('document'))
    return 'eva:file-text-outline';
  if (contentType.includes('excel') || contentType.includes('spreadsheet'))
    return 'eva:grid-outline';
  if (contentType.includes('presentation') || contentType.includes('powerpoint'))
    return 'eva:monitor-outline';
  if (contentType.includes('zip') || contentType.includes('compressed'))
    return 'eva:archive-outline';

  return 'eva:file-outline';
};
