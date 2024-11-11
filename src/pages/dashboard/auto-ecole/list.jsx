import { Helmet } from 'react-helmet-async';

import { Box, CircularProgress } from '@mui/material';

import { useAutoEcoles } from 'src/hooks/use-auto-ecole';

import { CONFIG } from 'src/config-global';

import { EmptyContent } from 'src/components/empty-content';

import { AutoEcoleListView } from 'src/sections/auto-ecole/view';

// ----------------------------------------------------------------------

const metadata = {
  title: `Auto Ecole | Dashboard - ${CONFIG.name}`,
};

export default function Page() {
  const { data, loading, error } = useAutoEcoles();

  if (error) {
    return (
      <EmptyContent
        title="Erreur"
        description={error.message || 'Une erreur est survenue lors du chargement des données'}
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      ) : (
        <AutoEcoleListView data={data} loading={loading} error={error} />
      )}
    </>
  );
}
