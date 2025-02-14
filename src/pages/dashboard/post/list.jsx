import { Helmet } from 'react-helmet-async';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuth } from 'src/hooks/use-auth';
import { usePosts } from 'src/hooks/use-posts';

import { CONFIG } from 'src/config-global';

import { PostListView } from 'src/sections/blog/view';

// ----------------------------------------------------------------------

const metadata = { title: `Liste des articles | Tableau de bord - ${CONFIG.name}` };

export default function Page() {
  const { user, loading } = useAuth();

  const { posts } = usePosts();

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
        <PostListView currentUser={user} posts={posts} />
      )}
    </>
  );
}
