import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, updateDoc, collection } from 'firebase/firestore';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { db, auth, storage } from 'src/utils/firebase';

import { _tags } from 'src/_mock';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { PostDetailsPreview } from './post-details-preview';

// ----------------------------------------------------------------------

export const NewPostSchema = zod.object({
  title: zod.string().min(1, { message: 'Le titre est requis !' }),
  description: zod.string().min(1, { message: 'La description est requise !' }),
  content: schemaHelper
    .editor()
    .min(100, { message: 'Le contenu doit faire au moins 100 caractères' }),
  coverUrl: schemaHelper.file({
    message: { required_error: "L'image de couverture est requise !" },
  }),
  tags: zod.string().array().min(2, { message: 'Il faut au moins 2 tags !' }),
  metaKeywords: zod.string().array().nonempty({ message: 'Les mots-clés meta sont requis !' }),
  readingTime: zod.number().min(1, { message: 'Le temps de lecture est requis !' }),
  // Not required
  metaTitle: zod.string(),
  metaDescription: zod.string(),
});

// ----------------------------------------------------------------------

export function PostNewEditForm({ currentPost }) {
  const router = useRouter();
  const [isCommentsEnabled, setIsCommentsEnabled] = useState(true);
  const [isPublish, setIsPublish] = useState(true);

  const preview = useBoolean();

  const handleSwitchChange = (event) => {
    setIsCommentsEnabled(event.target.checked);
  };

  const handleSwitchChange2 = (event) => {
    setIsPublish(event.target.checked);
  };

  // console.log("Les commentaires sont", isCommentsEnabled ? "activés" : "désactivés");
  // console.log("Post publié", isPublish ? "Oui" : "Non");

  const defaultValues = useMemo(
    () => ({
      title: currentPost?.title || '',
      description: currentPost?.description || '',
      content: currentPost?.content || '',
      coverUrl: currentPost?.coverUrl || null,
      tags: currentPost?.tags || [],
      metaKeywords: currentPost?.metaKeywords || [],
      metaTitle: currentPost?.metaTitle || '',
      metaDescription: currentPost?.metaDescription || '',
      readingTime: currentPost?.readingTime || 1,
      createdAt: currentPost?.createdAt || Date.now(),
      isCommentsEnabled: currentPost?.isCommentsEnabled || true,
      publish: currentPost?.publish || 'draft',
    }),
    [currentPost]
  );

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(NewPostSchema),
    defaultValues,
  });
  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = methods;

  // Réinitialiser les valeurs du formulaire lorsque currentPost change
  useEffect(() => {
    reset(defaultValues);
  }, [currentPost, reset, defaultValues]);

  const values = watch();

  useEffect(() => {
    if (currentPost) {
      reset(defaultValues);
    }
  }, [currentPost, defaultValues, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const { coverUrl: initialCoverUrl, ...otherData } = data;
      let coverUrl = initialCoverUrl;

      if (data.coverUrl && data.coverUrl instanceof File) {
        const userId = currentPost?.id || doc(collection(db, 'posts')).id;
        const fileName = `coverUrls/${userId}/${Date.now()}_${data.coverUrl.name}`;
        const storageRef = ref(storage, fileName);

        await uploadBytes(storageRef, data.coverUrl);
        coverUrl = await getDownloadURL(storageRef);
      }

      const now = Date.now();
      const slug = otherData.title.toLowerCase().replace(/\s+/g, '-');

      const userData = {
        ...otherData,
        coverUrl,
        authorId: auth.currentUser.uid,
        slug,
        author: [
          {
            avatarUrl: auth.currentUser.photoURL
              ? auth.currentUser.photoURL
              : 'https://api-dev-minimal-v6.vercel.app/assets/images/avatar/avatar-25.webp',
            name: auth.currentUser.displayName ? auth.currentUser.displayName : 'Author',
          },
        ],
        updatedAt: now,
        totalViews: currentPost?.totalViews || 0,
        totalShares: currentPost?.totalShares || 0,
        totalComments: currentPost?.totalComments || 0,
        isCommentsEnabled,
        publish: isPublish ? 'published' : 'draft',
      };

      // Si c'est un nouveau post, ajoutez createdAt
      if (!currentPost) {
        userData.createdAt = now;
      }

      const usersRef = collection(db, 'posts');
      const newUserRef = currentPost ? doc(usersRef, currentPost.id) : doc(usersRef);

      if (currentPost) {
        // Si c'est une mise à jour, utilisez updateDoc pour ne pas écraser createdAt
        await updateDoc(newUserRef, userData);
      } else {
        // Si c'est un nouveau post, utilisez setDoc
        await setDoc(newUserRef, userData);
      }

      reset();
      toast.success(currentPost ? 'Update success!' : 'Create success!');
      router.push(paths.dashboard.post.list);
      // console.info('DATA', userData);
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    }
  });

  const handleRemoveFile = useCallback(() => {
    setValue('coverUrl', null);
  }, [setValue]);

  const renderDetails = (
    <Card>
      <CardHeader title="Détails" subheader="Titre, description courte, image..." sx={{ mb: 3 }} />

      <Divider />

      <Stack spacing={3} sx={{ p: 3 }}>
        <Field.Text name="title" label="Titre de l'article" />

        <Field.Text name="description" label="Description" multiline rows={3} />

        <Stack spacing={1.5}>
          <Typography variant="subtitle2">Contenu</Typography>
          <Field.Editor name="content" sx={{ maxHeight: 480 }} />
        </Stack>

        <Stack spacing={1.5}>
          <Typography variant="subtitle2">Image de couverture</Typography>
          <Field.Upload name="coverUrl" maxSize={3145728} onDelete={handleRemoveFile} />
        </Stack>
      </Stack>
    </Card>
  );

  const renderProperties = (
    <Card>
      <CardHeader
        title="Propriétés"
        subheader="Fonctions et attributs additionnels..."
        sx={{ mb: 3 }}
      />

      <Divider />

      <Stack spacing={3} sx={{ p: 3 }}>
        <Field.Select name="readingTime" label="Temps de lecture (en minutes)" required>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30].map((time) => (
            <MenuItem key={time} value={time}>
              {time} {time === 1 ? 'minute' : 'minutes'}
            </MenuItem>
          ))}
        </Field.Select>

        <Field.Autocomplete
          name="tags"
          label="Tags"
          placeholder="+ Tags"
          multiple
          freeSolo
          disableCloseOnSelect
          options={_tags.map((option) => option)}
          getOptionLabel={(option) => option}
          renderOption={(props, option) => (
            <li {...props} key={option}>
              {option}
            </li>
          )}
          renderTags={(selected, getTagProps) =>
            selected.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={option}
                label={option}
                size="small"
                color="info"
                variant="soft"
              />
            ))
          }
        />

        <Field.Text name="metaTitle" label="Meta title" />

        <Field.Text name="metaDescription" label="Meta description" fullWidth multiline rows={3} />

        <Field.Autocomplete
          name="metaKeywords"
          label="Meta keywords"
          placeholder="+ Keywords"
          multiple
          freeSolo
          disableCloseOnSelect
          options={_tags.map((option) => option)}
          getOptionLabel={(option) => option}
          renderOption={(props, option) => (
            <li {...props} key={option}>
              {option}
            </li>
          )}
          renderTags={(selected, getTagProps) =>
            selected.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={option}
                label={option}
                size="small"
                color="info"
                variant="soft"
              />
            ))
          }
        />

        <FormControlLabel
          control={
            <Switch
              checked={isCommentsEnabled}
              onChange={handleSwitchChange}
              inputProps={{ id: 'comments-switch' }}
            />
          }
          label="Activer les commentaires"
        />
      </Stack>
    </Card>
  );

  const renderActions = (
    <Box display="flex" alignItems="center" flexWrap="wrap" justifyContent="flex-end">
      <FormControlLabel
        control={
          <Switch
            checked={isPublish}
            onChange={handleSwitchChange2}
            inputProps={{ id: 'publish-switch' }}
          />
        }
        label="Publier"
        sx={{ pl: 3, flexGrow: 1 }}
      />

      <div>
        <Button color="inherit" variant="outlined" size="large" onClick={preview.onTrue}>
          Aperçu
        </Button>

        <LoadingButton
          type="submit"
          variant="contained"
          size="large"
          loading={isSubmitting}
          sx={{ ml: 2 }}
        >
          {!currentPost ? "Créer l'article" : 'Enregistrer les modifications'}
        </LoadingButton>
      </div>
    </Box>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={5} sx={{ mx: 'auto', maxWidth: { xs: 720, xl: 880 } }}>
        {renderDetails}

        {renderProperties}

        {renderActions}
      </Stack>

      <PostDetailsPreview
        isValid={isValid}
        onSubmit={onSubmit}
        title={values.title}
        open={preview.value}
        content={values.content}
        onClose={preview.onFalse}
        coverUrl={values.coverUrl}
        isSubmitting={isSubmitting}
        description={values.description}
      />
    </Form>
  );
}
