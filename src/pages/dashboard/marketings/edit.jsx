import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import { useFetchPostById } from 'src/hooks/use-marketings-post';

import { CONFIG } from 'src/config-global';

import { PostEditView } from 'src/sections/marketings/view';

// ----------------------------------------------------------------------

const metadata = { title: `Post edit | Dashboard - ${CONFIG.name}` };

export default function Page() {
  const { id = '' } = useParams();

  const { postById } = useFetchPostById(id);
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <PostEditView post={postById} />
    </>
  );
}
