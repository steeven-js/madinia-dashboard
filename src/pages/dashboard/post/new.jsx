import { Helmet } from 'react-helmet-async';

import { Box, Alert, CircularProgress } from '@mui/material';

import { usePostCategories } from 'src/hooks/use-posts';

import { CONFIG } from 'src/config-global';

import { PostCreateView } from 'src/sections/blog/view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new post | Dashboard - ${CONFIG.name}` };

export default function Page() {
  const { categories, loading, error } = usePostCategories();

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Une erreur est survenue: {error.message}</Alert>;
  }
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <PostCreateView categories={categories} />
    </>
  );
}
