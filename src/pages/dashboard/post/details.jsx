import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import { useFetchPostById } from 'src/hooks/use-posts';

import { CONFIG } from 'src/config-global';

import { PostDetailsView } from 'src/sections/blog/view';

// ----------------------------------------------------------------------

const metadata = { title: `Post details | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  const { id = '' } = useParams();

  const { postById, postByIdLoading, postError } = useFetchPostById(id);

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <PostDetailsView post={postById} loading={postByIdLoading} error={postError} id={id} />
    </>
  );
}
