import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';

import {
  Box,
  Grid,
  Card,
  Dialog,
  Button,
  CardMedia,
  IconButton,
  Typography,
  CardActions,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

// Composant principal pour la gestion des images
const PostImageManager = ({ postId }) => {
  // État pour stocker les images
  const [images, setImages] = useState([]);
  // État pour le dialog de confirmation de suppression
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    imageId: null,
  });

  // Configuration de dropzone pour l'upload d'images
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
    },
    onDrop: async (acceptedFiles) => {
      // TODO: Implémenter la logique d'upload
      // Les images devraient être uploadées dans `/postImageUrl/${postId}/`
      const newImages = acceptedFiles.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        url: URL.createObjectURL(file),
        name: file.name,
      }));
      setImages([...images, ...newImages]);
    },
  });

  // Gérer la suppression d'une image
  const handleDeleteImage = (imageId) => {
    setDeleteDialog({
      open: true,
      imageId,
    });
  };

  // Confirmer la suppression d'une image
  const confirmDelete = async () => {
    // TODO: Implémenter la logique de suppression sur le serveur
    const newImages = images.filter((img) => img.id !== deleteDialog.imageId);
    setImages(newImages);
    setDeleteDialog({ open: false, imageId: null });
  };

  // Gérer l'édition d'une image (à implémenter)
  const handleEditImage = (imageId) => {
    // TODO: Implémenter la logique d'édition
    console.log('Édition de l\'image:', imageId);
  };

  return (
    <Box sx={{ mt: 3 }}>
      {/* Zone d'upload */}
      <Card
        {...getRootProps()}
        sx={{
          p: 3,
          mb: 3,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
        }}
      >
        <input {...getInputProps()} />
        <Box sx={{ textAlign: 'center' }}>
          <Iconify icon="material-symbols:cloud-upload" width={40} height={40} />
          <Typography variant="body1" sx={{ mt: 1 }}>
            {isDragActive
              ? 'Déposez les fichiers ici...'
              : 'Glissez et déposez des images ou cliquez pour sélectionner'}
          </Typography>
        </Box>
      </Card>

      {/* Grille d'images */}
      <Grid container spacing={2}>
        {images.map((image) => (
          <Grid item xs={12} sm={6} md={4} key={image.id}>
            <Card>
              <CardMedia
                component="img"
                height="200"
                image={image.url}
                alt={image.name}
                sx={{ objectFit: 'cover' }}
              />
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                <IconButton onClick={() => handleEditImage(image.id)} size="small">
                  <Iconify icon="material-symbols:edit" />
                </IconButton>
                <IconButton onClick={() => handleDeleteImage(image.id)} size="small" color="error">
                  <Iconify icon="material-symbols:delete" />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, imageId: null })}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer cette image ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, imageId: null })}>Annuler</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PostImageManager;
