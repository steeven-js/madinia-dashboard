import { Helmet } from 'react-helmet-async';

import { Box, Typography, CircularProgress } from '@mui/material';

import { useParams } from 'src/routes/hooks';

import { useEventById } from 'src/hooks/use-event';

import { CONFIG } from 'src/config-global';

import { EventEditView } from 'src/sections/event/view';

// ----------------------------------------------------------------------

const metadata = { title: `Event edit | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const { id = '' } = useParams();

  const { event, loading, error } = useEventById(id);

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography variant="h4" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

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
        <EventEditView event={event} />
      )}
    </>
  );
}
