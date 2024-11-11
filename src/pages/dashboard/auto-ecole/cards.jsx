import { Box, CircularProgress } from '@mui/material';
import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { useAutoEcoles } from 'src/hooks/use-auto-ecole';
import { AutolEcoleCardsView } from 'src/sections/auto-ecole/view';

// ----------------------------------------------------------------------

const metadata = { title: `User cards | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const { data, loading, error } = useAutoEcoles();

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      ) : (
        <AutolEcoleCardsView autoEcoles={data} error={error} />
      )}
    </>
  );
}
