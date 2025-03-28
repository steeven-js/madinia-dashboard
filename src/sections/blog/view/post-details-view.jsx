import { useState, useEffect, useCallback } from 'react';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
// import Checkbox from '@mui/material/Checkbox';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
// import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

// import { fShortenNumber } from 'src/utils/format-number';

import { useUpdatePostPublish } from 'src/hooks/use-posts';

import { POST_PUBLISH_OPTIONS } from 'src/_mock';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Markdown } from 'src/components/markdown';
import { EmptyContent } from 'src/components/empty-content';

import { PostDetailsHero } from '../post-details-hero';
import { PostDetailsSkeleton } from '../post-skeleton';
import { PostDetailsToolbar } from '../post-details-toolbar';

// ----------------------------------------------------------------------

export function PostDetailsView({ post, loading, error, id }) {
  const [publish, setPublish] = useState('');

  const { handleUpdatePublish } = useUpdatePostPublish();

  const handleChangePublish = useCallback(async (newValue) => {
    try {
      const result = await handleUpdatePublish(id, newValue);
      if (result.success) {
        setPublish(newValue);
        toast.success('Publish status updated');
      } else {
        // Optionally handle error, maybe show a notification
        console.error('Failed to update publish status');
        toast.error('Failed to update publish status');
      }
    } catch (err) {
      console.error('Error in handleChangePublish:', err);
      toast.error('Error in handleChangePublish');
    }
  }, [id, handleUpdatePublish]);

  useEffect(() => {
    if (post) {
      setPublish(post?.publish);
    }
  }, [post]);

  if (loading) {
    return (
      <DashboardContent maxWidth={false} disablePadding>
        <PostDetailsSkeleton />
      </DashboardContent>
    );
  }

  if (error) {
    return (
      <DashboardContent maxWidth={false}>
        <EmptyContent
          filled
          title="Post not found!"
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.post.root}
              startIcon={<Iconify width={16} icon="eva:arrow-ios-back-fill" />}
              sx={{ mt: 3 }}
            >
              Back to list
            </Button>
          }
          sx={{ py: 10, height: 'auto', flexGrow: 'unset' }}
        />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth={false} disablePadding>
      <Container maxWidth={false} sx={{ px: { sm: 5 } }}>
        <PostDetailsToolbar
          backLink={paths.dashboard.post.root}
          editLink={paths.dashboard.post.edit(`${post?.id}`)}
          liveLink={paths.post.details(`${post?.id}`)}
          publish={`${publish}`}
          onChangePublish={handleChangePublish}
          publishOptions={POST_PUBLISH_OPTIONS}
        />
      </Container>

      <PostDetailsHero title={`${post?.title}`} coverUrl={`${post?.coverUrl}`} />

      <Stack
        sx={{
          pb: 5,
          mx: 'auto',
          maxWidth: 720,
          mt: { xs: 5, md: 10 },
          px: { xs: 2, sm: 3 },
        }}
      >
        <Typography variant="subtitle1">{post?.description}</Typography>

        <Markdown children={post?.content} />

        <Stack
          spacing={3}
          sx={{
            py: 3,
            borderTop: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
            borderBottom: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
          }}
        >
          <Stack direction="row" flexWrap="wrap" spacing={1}>
            {post?.tags.map((tag) => (
              <Chip key={tag} label={tag} variant="soft" />
            ))}
          </Stack>

          {/* <Stack direction="row" alignItems="center">
            <FormControlLabel
              control={
                <Checkbox
                  defaultChecked
                  size="small"
                  color="error"
                  icon={<Iconify icon="solar:heart-bold" />}
                  checkedIcon={<Iconify icon="solar:heart-bold" />}
                  inputProps={{ id: 'favorite-checkbox', 'aria-label': 'Favorite checkbox' }}
                />
              }
              label={fShortenNumber(post?.totalFavorites)}
              sx={{ mr: 1 }}
            />
          </Stack> */}
        </Stack>
      </Stack>
    </DashboardContent>
  );
}
