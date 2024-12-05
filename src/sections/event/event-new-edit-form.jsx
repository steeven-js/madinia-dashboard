import { z as zod } from 'zod';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, updateDoc, collection } from 'firebase/firestore';

import {
  Box,
  Card,
  Stack,
  Button,
  Divider,
  MenuItem,
  CardHeader,
  IconButton,
  Typography,
  InputAdornment,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import useImageUpload from 'src/hooks/use-event-image';

import { db, storage } from 'src/utils/firebase';

import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------

// Schema definition remains the same...
export const NewEventSchema = zod.object({
  title: zod.string().min(1, { message: 'Le titre est requis !' }),
  status: zod.string(),
  location: zod.string().min(1, { message: 'Le lieu est requis !' }),
  date: schemaHelper.date({
    message: { required_error: 'La date est requise !' },
  }),
  price: zod.number().min(0, { message: 'Le prix doit être de 0 ou plus' }),
  description: zod.string().min(1, { message: 'La description est requise !' }),
  image: schemaHelper.file({
    message: { required_error: 'Single upload is required!' },
  }),
  images: schemaHelper.files({
    // Changé de 'images' à 'images' pour correspondre au nom du champ
    message: { required_error: 'Les images sont requises !' },
  }),
  speakers: zod.array(zod.string()),
  participants: zod.object({
    max: zod
      .number()
      .min(1, { message: 'Le nombre maximum de participants doit être supérieur à 0' }),
    current: zod.number(),
  }),
});

// ----------------------------------------------------------------------

export function EventNewEditForm({ event: currentEvent }) {
  const router = useRouter();

  const { removeImage, removeAllImages } = useImageUpload(currentEvent?.id);

  const defaultValues = useMemo(
    () => ({
      title: currentEvent?.title || '',
      status: currentEvent?.status || 'draft',
      date: currentEvent?.date || null,
      location: currentEvent?.location || '',
      price: currentEvent?.price || 0,
      description: currentEvent?.description || '',
      image: currentEvent?.image || '',
      images: currentEvent?.images || [],
      speakers: currentEvent?.speakers || [],
      participants: {
        max: currentEvent?.participants?.max || 10,
        current: currentEvent?.participants?.current || 0,
      },
    }),
    [currentEvent]
  );

  const methods = useForm({
    resolver: zodResolver(NewEventSchema),
    defaultValues,
  });

  const { control } = methods;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'speakers',
  });

  const {
    watch,
    reset,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  useEffect(() => {
    if (currentEvent) {
      reset(defaultValues);
    }
  }, [currentEvent, defaultValues, reset]);

  const handleOneUpload = async (acceptedFile) => {
    try {
      const file = acceptedFile[0]; // Prendre le premier fichier car c'est un upload unique
      const fileName = `events/${currentEvent?.id || Date.now()}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      // Définir l'URL comme valeur de l'image
      setValue('image', url);
      toast.success('Image uploadée avec succès!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error("Échec de l'upload de l'image");
    }
  };

  const handleUpload = async (acceptedFiles) => {
    try {
      // Upload des nouveaux fichiers
      const uploadedUrls = await Promise.all(
        acceptedFiles.map(async (file) => {
          const fileName = `events/${currentEvent?.id || Date.now()}/${Date.now()}_${file.name}`;
          const storageRef = ref(storage, fileName);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          return url;
        })
      );

      // Ajouter les nouvelles URLs aux images existantes
      setValue('images', [...values.images, ...uploadedUrls]);
      toast.success('Images uploadées avec succès!');
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error("Échec de l'upload des images");
    }
  };

  const onSubmit = async (data) => {
    try {
      // console.log('Form data:', data);

      // Validation supplémentaire si nécessaire
      if (!data.title || !data.location) {
        toast.error('Veuillez remplir tous les champs requis');
        return;
      }

      // Les images sont déjà sous forme d'URLs à ce stade
      const eventData = {
        ...data,
        images: data.images || [], // S'assurer que images n'est jamais undefined
      };

      if (currentEvent) {
        const eventRef = doc(db, 'events', currentEvent?.id);
        await updateDoc(eventRef, eventData);
        router.push(paths.dashboard.event.root);
      } else {
        const eventsRef = collection(db, 'events');
        await setDoc(doc(eventsRef), eventData);
        router.push(paths.dashboard.event.root);
      }

      toast.success(currentEvent ? 'Event updated!' : 'Event created!');
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event');
    }
  };

  const handleRemoveFile = useCallback(
    async (inputFile) => {
      await removeImage(inputFile);
      const filtered = values.images?.filter((file) => file !== inputFile);
      setValue('images', filtered);
    },
    [setValue, values.images, removeImage]
  );

  const handleRemoveAllFiles = useCallback(async () => {
    await removeAllImages();
    setValue('images', []);
  }, [setValue, removeAllImages]);

  const renderDetails = (
    <Card>
      <CardHeader title="Détails" subheader="Titre, description courte, image..." sx={{ mb: 3 }} />

      <Divider />

      <Stack spacing={3} sx={{ p: 3 }}>
        <Field.Text name="title" label="Titre de l'événement" required />

        <Field.DatePicker name="date" label="Date de l'événement" required />

        <Field.Select fullWidth name="status" label="Statut">
          {[
            { value: 'draft', label: 'Brouillon' },
            { value: 'current', label: 'En cours' },
            { value: 'past', label: 'Terminé' },
            { value: 'cancelled', label: 'Annulé' },
          ].map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field.Select>

        <Field.Select fullWidth name="location" label="Lieu">
          {['Martinique', 'Guadeloupe', 'Paris'].map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Field.Select>

        <Field.Text name="description" label="Description" multiline rows={4} required />

        <Stack spacing={1.5}>
          <Typography variant="subtitle2">Image Principale</Typography>
          <Field.Upload
            single
            name="image"
            maxSize={3145728}
            onDrop={handleOneUpload}
            onRemove={() => setValue('image', '')}
            helperText="Format accepté : image uniquement. Taille maximale : 3MB"
            file={{
              preview: currentEvent?.image,
              url: currentEvent?.image,
              type: 'image/*',
            }}
            accept={{
              'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
            }}
          />
        </Stack>

        <Stack spacing={1.5}>
          <Typography variant="subtitle2">Images</Typography>
          <Field.Upload
            multiple
            thumbnail
            name="images"
            maxSize={3145728}
            onDrop={handleUpload}
            onRemove={handleRemoveFile}
            onRemoveAll={handleRemoveAllFiles}
            helperText="Format accepté : images uniquement. Taille maximale : 3MB"
            files={values.images.map((url) => ({
              preview: url,
              url,
              type: 'image/*',
            }))}
            // Ajouter ces props pour plus de contrôle
            accept={{
              'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
            }}
          />
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

      <Stack spacing={2} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ color: 'text.disabled', mb: 3 }}>
          Intervenants :
        </Typography>

        {fields.map((field, index) => (
          <Stack key={field.id} direction="row" spacing={2} alignItems="center">
            <Field.Text name={`speakers.${index}`} label={`Intervenant ${index + 1}`} required />
            <IconButton onClick={() => remove(index)} color="error">
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Stack>
        ))}

        <Button
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => append('')}
          variant="soft"
        >
          Ajouter un intervenant
        </Button>
      </Stack>
    </Card>
  );

  const renderPricing = (
    <Card>
      <CardHeader title="Tarification" subheader="Informations sur les prix" sx={{ mb: 3 }} />

      <Divider />

      <Stack spacing={3} sx={{ p: 3 }}>
        <Field.Text
          name="price"
          label="Prix régulier"
          placeholder="0.00"
          type="number"
          InputLabelProps={{ shrink: true }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Box component="span" sx={{ color: 'text.disabled' }}>
                  €
                </Box>
              </InputAdornment>
            ),
          }}
        />
      </Stack>
    </Card>
  );

  const renderActions = (
    <Stack spacing={3} direction="row" alignItems="center" flexWrap="wrap">
      <Button
        type="submit"
        variant="outlined"
        size="large"
        disabled={isSubmitting}
        sx={{ color: 'error.main' }}
      >
        {!currentEvent ? 'Create event' : 'Save changes'}
      </Button>
    </Stack>
  );

  return (
    <Form methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={{ xs: 3, md: 5 }} sx={{ mx: 'auto', maxWidth: { xs: 720, xl: 880 } }}>
        {renderDetails}

        {renderProperties}

        {renderPricing}

        {renderActions}
      </Stack>
    </Form>
  );
}
