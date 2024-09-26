import { Helmet } from 'react-helmet-async';

import { Box, CircularProgress } from '@mui/material';

import { useParams } from 'src/routes/hooks';

import { useFetchPostById } from 'src/hooks/use-marketings-post';

import { CONFIG } from 'src/config-global';

import { PostDetailsView } from 'src/sections/marketings/view';

// ----------------------------------------------------------------------

const metadata = { title: `Post details | Dashboard - ${CONFIG.name}` };

export default function Page() {
  const { id = '' } = useParams();

  const { postById, postByIdLoading, postError } = useFetchPostById(id);

  if (postByIdLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <PostDetailsView post={postById} loading={postByIdLoading} error={postError} id={id} />
    </>
  );
}
