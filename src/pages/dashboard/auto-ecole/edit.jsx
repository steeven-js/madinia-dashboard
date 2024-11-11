import { Helmet } from 'react-helmet-async';

import { Box, CircularProgress } from '@mui/material';

import { useParams } from 'src/routes/hooks';

import { useAutoEcoleById } from 'src/hooks/use-auto-ecole';

import { CONFIG } from 'src/config-global';

import { EmptyContent } from 'src/components/empty-content';

import { AutolEcoleEditView } from 'src/sections/auto-ecole/view';

// ----------------------------------------------------------------------

const metadata = { title: `Auto Ecole edit | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const { id = '' } = useParams();

  const { autoEcoleById, autoEcoleByIdLoading, autoEcoleError } = useAutoEcoleById(id);

  if (autoEcoleError) {
    return (
      <EmptyContent
          title="Erreur"
          description={
            autoEcoleError.message || 'Une erreur est survenue lors du chargement des données'
          }
        />
    );
  }

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      {autoEcoleByIdLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      ) : autoEcoleById.length === 0 ? (
        <EmptyContent title="Aucune auto école" />
      ) : (
        <AutolEcoleEditView currentAutoEcole={autoEcoleById} />
      )}
    </>
  );
}
