import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { storage, db } from 'src/utils/firebase';
import { toast } from 'src/components/snackbar';

const useImageUpload = (eventId) => {
  const [isUploading, setIsUploading] = useState(false);

  // const uploadImages = async (files) => {
  //   console.log('Starting upload with files:', files);
  //   setIsUploading(true);

  //   try {
  //     const uploadPromises = Array.from(files).map(async (file) => {
  //       console.log('Uploading file:', file.name);
  //       // Use temp folder for new events, specific event folder for existing events
  //       const folderPath = eventId ? `events/${eventId}` : 'events/temp';
  //       const filename = `${folderPath}/${Date.now()}_${file.name}`;
  //       const storageRef = ref(storage, filename);

  //       const snapshot = await uploadBytes(storageRef, file);
  //       const url = await getDownloadURL(snapshot.ref);
  //       console.log('File uploaded, URL:', url);
  //       return url;
  //     });

  //     const urls = await Promise.all(uploadPromises);
  //     console.log('All files uploaded, URLs:', urls);

  //     // Only update Firestore if we have an eventId
  //     if (eventId) {
  //       const eventRef = doc(db, 'events', eventId);
  //       await updateDoc(eventRef, {
  //         images: arrayUnion(...urls)
  //       });
  //       console.log('Firestore updated with new URLs');
  //     }

  //     toast.success('Images uploaded successfully');
  //     return urls;
  //   } catch (error) {
  //     console.error('Upload error:', error);
  //     toast.error(error.message || 'Failed to upload images');
  //     return [];
  //   } finally {
  //     setIsUploading(false);
  //   }
  // };

  const removeImage = async (imageUrl) => {
    if (!eventId) {
      console.log('No event ID for image removal');
      return;
    }

    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        images: arrayRemove(imageUrl)
      });
      toast.success('Image removed successfully');
    } catch (error) {
      console.error('Remove error:', error);
      toast.error(error.message || 'Failed to remove image');
    }
  };

  const removeAllImages = async () => {
    if (!eventId) {
      console.log('No event ID for removing all images');
      return;
    }

    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        images: []
      });
      toast.success('All images removed successfully');
    } catch (error) {
      console.error('Remove all error:', error);
      toast.error(error.message || 'Failed to remove all images');
    }
  };

  return {
    // uploadImages,
    removeImage,
    removeAllImages,
    isUploading
  };
};

export default useImageUpload;
