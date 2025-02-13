import { Helmet } from 'react-helmet-async';

import { Box, Alert, CircularProgress } from '@mui/material';

import { useParams } from 'src/routes/hooks';

import { useFetchPostById, usePostCategories } from 'src/hooks/use-posts';

import { CONFIG } from 'src/config-global';

import { PostEditView } from 'src/sections/blog/view';

// ----------------------------------------------------------------------

const metadata = { title: `Post edit | Dashboard - ${CONFIG.name}` };

export default function Page() {
  const { id = '' } = useParams();

  const { postById, postByIdLoading, postError } = useFetchPostById(id);

  const { categories, loading, error } = usePostCategories();

  if (loading && postByIdLoading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error && postError) {
    return <Alert severity="error">Une erreur est survenue: {error.message}</Alert>;
  }

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <PostEditView post={postById} categories={categories} />
    </>
  );
}
