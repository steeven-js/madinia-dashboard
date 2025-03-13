import { toast } from 'sonner';
import { useState } from 'react';
import { getDocs, collection } from 'firebase/firestore';

import {
  Box,
  Card,
  Button,
  MenuItem,
  TextField,
  CardHeader,
  CardContent,
  CircularProgress,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

const collections = [
  'auto-ecole',
  'calendar-events',
  'contacts',
  'events',
  'messages',
  'newsletters',
  'postCategories',
  'posts',
  'users',
];

export default function FirestoreExport({ db }) {
  const [selectedCollection, setSelectedCollection] = useState('');
  const [jsonData, setJsonData] = useState('');
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!selectedCollection) {
      toast.error('Veuillez sélectionner une collection');
      return;
    }

    setLoading(true);
    try {
      // Référence à la collection
      const collectionRef = collection(db, selectedCollection);

      // Récupérer tous les documents de la collection
      const querySnapshot = await getDocs(collectionRef);

      // Convertir les documents en objets JavaScript
      const data = {};
      querySnapshot.forEach((doc) => {
        data[doc.id] = doc.data();
      });

      // Convertir en JSON formaté
      setJsonData(JSON.stringify(data, null, 2));
      toast.success('Données exportées avec succès');
    } catch (error) {
      console.error("Erreur lors de l'exportation des données:", error);
      toast.error(`Erreur: ${error.message}`);
      setJsonData('');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard
      .writeText(jsonData)
      .then(() => {
        toast.success('Copié dans le presse-papiers');
      })
      .catch((err) => {
        toast.error('Erreur lors de la copie');
      });
  };

  const handleDownload = () => {
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCollection}-export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader title="Exporter une collection en JSON" />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            select
            fullWidth
            label="Sélectionner une collection"
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
          >
            {collections.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleExport}
              disabled={!selectedCollection || loading}
              startIcon={loading ? null : <Iconify icon="eva:download-outline" />}
            >
              {loading ? <CircularProgress size={24} /> : 'Exporter'}
            </Button>

            {jsonData && (
              <>
                <Button
                  variant="outlined"
                  onClick={handleCopyToClipboard}
                  startIcon={<Iconify icon="eva:copy-outline" />}
                >
                  Copier
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleDownload}
                  startIcon={<Iconify icon="eva:download-outline" />}
                >
                  Télécharger
                </Button>
              </>
            )}
          </Box>

          {jsonData && (
            <TextField
              multiline
              fullWidth
              rows={20}
              value={jsonData}
              InputProps={{
                readOnly: true,
              }}
              sx={{
                fontFamily: 'monospace',
                '& .MuiInputBase-input': {
                  fontFamily: 'monospace',
                },
              }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
