import { Helmet } from 'react-helmet-async';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuth } from 'src/hooks/use-auth';
import { usePosts } from 'src/hooks/use-posts';

import { CONFIG } from 'src/config-global';

import { PostListView } from 'src/sections/blog/view';
import { EmptyContent } from 'src/components/empty-content';

// ----------------------------------------------------------------------

const metadata = { title: `Post list | Dashboard - ${CONFIG.name}` };

export default function Page() {
  const { user, loading: authLoading } = useAuth();
  const { posts, loading: postsLoading } = usePosts();

  const isLoading = authLoading || postsLoading;

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      ) : posts.length === 0 ? (
        <EmptyContent title="Aucun post" />
      ) : (
        <PostListView currentUser={user} posts={posts} />
      )}
    </>
  );
}
