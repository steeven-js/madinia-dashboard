import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogActions from '@mui/material/DialogActions';

import { Markdown } from 'src/components/markdown';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';

import { PostDetailsHero } from './post-details-hero';

// ----------------------------------------------------------------------

export function PostDetailsPreview({
  open,
  title,
  content,
  isValid,
  onClose,
  coverUrl,
  onSubmit,
  description,
  isSubmitting,
}) {
  let previewUrl = '';

  if (coverUrl) {
    if (typeof coverUrl === 'string') {
      previewUrl = coverUrl;
    } else {
      previewUrl = URL.createObjectURL(coverUrl);
    }
  }

  const hasHero = title || previewUrl;

  const hasContent = title || description || content || previewUrl;

  return (
    <Dialog fullScreen open={open} onClose={onClose}>
      <DialogActions sx={{ py: 2, px: 3 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Aperçu
        </Typography>

        <Button variant="outlined" color="inherit" onClick={onClose}>
          Fermer
        </Button>

        <LoadingButton
          type="submit"
          variant="contained"
          disabled={!isValid}
          loading={isSubmitting}
          onClick={onSubmit}
        >
          Publier
        </LoadingButton>
      </DialogActions>

      <Divider />

      {hasContent ? (
        <Scrollbar>
          {(hasHero || previewUrl) && <PostDetailsHero title={title} coverUrl={previewUrl} />}
          <Container sx={{ mt: 5, mb: 10 }}>
            <Stack sx={{ mx: 'auto', maxWidth: 720 }}>
              <Typography variant="h6">{description}</Typography>
              <Markdown>{content}</Markdown>
            </Stack>
          </Container>
        </Scrollbar>
      ) : (
        <EmptyContent filled title="Contenu vide !" />
      )}
    </Dialog>
  );
}
