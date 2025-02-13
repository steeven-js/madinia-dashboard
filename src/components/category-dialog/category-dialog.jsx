import { useState, useEffect } from 'react';

import {
  Box,
  Button,
  Dialog,
  TextField,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

export function CategoryDialog({ open, handleClose, category, handleSubmit, mode }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (category && mode === 'edit') {
      setFormData({
        name: category.name || '',
        description: category.description || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
      });
    }
  }, [category, mode]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const onSubmit = () => {
    handleSubmit(formData);
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md" // Augmente la largeur maximale (options: 'xs', 'sm', 'md', 'lg', 'xl')
      fullWidth // Utilise toute la largeur disponible jusqu'à maxWidth
      PaperProps={{
        sx: {
          minHeight: '60vh', // Définit une hauteur minimale
          maxHeight: '80vh', // Limite la hauteur maximale
        }
      }}
    >
      <DialogTitle sx={{ fontSize: '1.5rem', py: 3 }}>
        {mode === 'add' ? 'Ajouter une catégorie' : 'Modifier la catégorie'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3, // Augmente l'espace entre les champs
          pt: 3,
          px: 2 // Ajoute un padding horizontal
        }}>
          <TextField
            autoFocus
            name="name"
            label="Nom"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            sx={{ '& .MuiInputBase-root': { fontSize: '1.1rem' } }} // Augmente la taille du texte
          />
          <TextField
            name="description"
            label="Description"
            value={formData.description}
            onChange={handleChange}
            fullWidth
            multiline
            rows={6} // Augmente le nombre de lignes
            sx={{ '& .MuiInputBase-root': { fontSize: '1.1rem' } }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}> {/* Augmente le padding des boutons */}
        <Button onClick={handleClose} size="large">
          Annuler
        </Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          size="large"
          sx={{ px: 4 }} // Augmente le padding horizontal du bouton
        >
          {mode === 'add' ? 'Ajouter' : 'Modifier'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
