import { useState, useCallback } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

import { storage } from 'src/utils/firebase';

import { UploadBox, MultiFilePreview } from 'src/components/upload';

// ----------------------------------------------------------------------

export function KanbanDetailsAttachments({ attachments, taskId, onUpdateAttachments }) {
  const [files, setFiles] = useState(attachments);
  const [isUploading, setIsUploading] = useState(false);

  // Adapter les pièces jointes pour FileThumbnail
  const adaptedFiles = files.map((file) => {
    // Si c'est un fichier déjà uploadé (avec une URL)
    if (file.url) {
      return {
        ...file,
        preview: file.url,
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        isUrl: true, // Marquer comme URL pour FileThumbnail
      };
    }
    // Si c'est un nouveau fichier
    return file;
  });

  const handleDrop = useCallback(
    async (acceptedFiles) => {
      setIsUploading(true);
      try {
        const uploadPromises = acceptedFiles.map(async (file) => {
          // Créer un nom de fichier unique avec l'ID de la tâche
          const fileName = `tasks/${taskId}/${Date.now()}_${file.name}`;
          const storageRef = ref(storage, fileName);

          // Upload du fichier
          const snapshot = await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(snapshot.ref);

          return {
            name: file.name,
            url: downloadURL,
            path: fileName,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified,
            preview: downloadURL,
            isUrl: true, // Marquer comme URL pour FileThumbnail
          };
        });

        const uploadedFiles = await Promise.all(uploadPromises);
        const newFiles = [...files, ...uploadedFiles];
        setFiles(newFiles);
        onUpdateAttachments(newFiles);
      } catch (error) {
        console.error('Error uploading files:', error);
      } finally {
        setIsUploading(false);
      }
    },
    [files, taskId, onUpdateAttachments]
  );

  const handleRemoveFile = useCallback(
    async (fileToRemove) => {
      try {
        // Supprimer le fichier du Storage
        if (fileToRemove.path) {
          const storageRef = ref(storage, fileToRemove.path);
          await deleteObject(storageRef);
        }

        // Mettre à jour l'état local et notifier le parent
        const filtered = files.filter((file) => file !== fileToRemove);
        setFiles(filtered);
        onUpdateAttachments(filtered);
      } catch (error) {
        console.error('Error removing file:', error);
      }
    },
    [files, onUpdateAttachments]
  );

  return (
    <MultiFilePreview
      thumbnail
      files={adaptedFiles}
      onRemove={(file) => handleRemoveFile(file)}
      slotProps={{ thumbnail: { sx: { width: 64, height: 64 } } }}
      lastNode={<UploadBox onDrop={handleDrop} disabled={isUploading} />}
    />
  );
}
