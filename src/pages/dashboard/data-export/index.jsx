import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

import { Tab, Tabs, Container, Typography } from '@mui/material';

import { CONFIG } from 'src/config-global';

// Sections
import FirestoreExport from 'src/sections/data-export/firestore-export';
import StorageExplorer from 'src/sections/data-export/storage-explorer';

// Initialize Firebase
const app = initializeApp(CONFIG.firebase);
const db = getFirestore(app);
const storage = getStorage(app);

// ----------------------------------------------------------------------

export default function DataExportPage() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <>
      <Helmet>
        <title>Exportation de données | Madinia Dashboard</title>
      </Helmet>

      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ mb: 5 }}>
          Exportation de données
        </Typography>

        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Firestore" />
          <Tab label="Storage" />
        </Tabs>

        {tabValue === 0 ? <FirestoreExport db={db} /> : <StorageExplorer storage={storage} />}
      </Container>
    </>
  );
}
