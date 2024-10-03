// Page.js
import { Helmet } from 'react-helmet-async';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useMarketingsPosts } from 'src/hooks/use-marketings-post';

import { CONFIG } from 'src/config-global';

import { EmptyContent } from 'src/components/empty-content';

import { PostListView } from 'src/sections/marketings/view';

const metadata = { title: `Marketings Posts | Dashboard - ${CONFIG.name}` };

export default function Page() {
  const {
    posts: marketingsPosts,
    loading: isLoading,
    error: marketinggsError,
  } = useMarketingsPosts();

  if (marketinggsError) {
    return <div>Erreur : {marketinggsError}</div>;
  }

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      ) : marketingsPosts.length === 0 ? (
        <EmptyContent title="Aucun post" />
      ) : (
        <PostListView posts={marketingsPosts} isLoading={isLoading} />
      )}
    </>
  );
}
