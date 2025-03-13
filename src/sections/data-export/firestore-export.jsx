import { toast } from 'sonner';
import { useState, useRef } from 'react';
import { getDocs, collection, doc, setDoc } from 'firebase/firestore';

import {
  Box,
  Card,
  Button,
  MenuItem,
  TextField,
  CardHeader,
  CardContent,
  CircularProgress,
  Divider,
  Typography,
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
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef(null);

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

  const handleImportFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!selectedCollection) {
      toast.error('Veuillez sélectionner une collection');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target.result;
        const data = JSON.parse(content);
        setImportLoading(true);
        await importDataToFirestore(data);
      } catch (error) {
        console.error('Erreur lors de la lecture du fichier:', error);
        toast.error(`Erreur: ${error.message}`);
      }
    };
    reader.readAsText(file);
  };

  const importDataToFirestore = async (data) => {
    try {
      const entries = Object.entries(data);
      setImportProgress({ current: 0, total: entries.length });

      for (const [docId, docData] of entries) {
        await setDoc(doc(db, selectedCollection, docId), docData);
        setImportProgress((prev) => ({ ...prev, current: prev.current + 1 }));
      }

      toast.success(
        `${entries.length} documents importés avec succès dans la collection "${selectedCollection}"`
      );
    } catch (error) {
      console.error("Erreur lors de l'importation des données:", error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setImportLoading(false);
      setImportProgress({ current: 0, total: 0 });
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card>
      <CardHeader title="Exporter/Importer une collection" />
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

            <Button
              variant="contained"
              color="secondary"
              onClick={handleImportFile}
              disabled={!selectedCollection || importLoading}
              startIcon={importLoading ? null : <Iconify icon="eva:upload-outline" />}
            >
              {importLoading ? <CircularProgress size={24} /> : 'Importer JSON'}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".json"
              onChange={handleFileChange}
            />

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

          {importLoading && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <CircularProgress size={30} />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Importation en cours: {importProgress.current}/{importProgress.total} documents
              </Typography>
            </Box>
          )}

          {jsonData && (
            <>
              <Divider sx={{ my: 2 }} />
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
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
