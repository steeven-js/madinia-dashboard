import { z as zod } from 'zod';
import { Form, Field, schemaHelper } from 'src/components/hook-form';
import {
  Box,
  Button,
  Card,
  CardHeader,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Iconify } from 'src/components/iconify';
import { zodResolver } from '@hookform/resolvers/zod';
import { db, storage } from 'src/utils/firebase';
import { toast } from 'sonner';
import { arrayUnion, collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import useImageUpload from 'src/hooks/use-event-image';
import { LoadingButton } from '@mui/lab';
import { paths } from 'src/routes/paths';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useRouter } from 'src/routes/hooks';

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

  const handleUpload = async (files) => {
    // Ensure files is an array
    const acceptedFiles = Array.isArray(files) ? files : [files];

    try {
      const uploadedUrls = await Promise.all(
        acceptedFiles.map(async (file) => {
          // Check if the file is actually a string/URL (meaning it's already uploaded)
          if (typeof file === 'string') return file;

          const fileName = `events/${currentEvent?.id || Date.now()}/${Date.now()}_${file.name}`;
          const storageRef = ref(storage, fileName);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          return url;
        })
      );

      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
      throw error;
    }
  };

  const onSubmit = async (data) => {
    try {
      console.log('Form data:', data);

      // Validation supplémentaire si nécessaire
      if (!data.title || !data.location) {
        toast.error('Veuillez remplir tous les champs requis');
        return;
      }

      // Créer une copie des données sans le champ images
      const { images, ...eventData } = data;

      // Si on a des fichiers à uploader
      if (images?.length) {
        try {
          // Upload des fichiers et récupération des URLs
          const uploadedUrls = await handleUpload(images);

          // Ajouter les URLs au document
          eventData.images = uploadedUrls;
        } catch (uploadError) {
          console.error('Error uploading files:', uploadError);
          toast.error("Erreur lors de l'upload des images");
          return;
        }
      }

      if (currentEvent) {
        const eventRef = doc(db, 'events', currentEvent.id);
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
          <Typography variant="subtitle2">Images</Typography>
          <Field.Upload
            multiple
            thumbnail
            name="images"
            maxSize={3145728}
            onRemove={handleRemoveFile}
            onRemoveAll={handleRemoveAllFiles}
            onDrop={handleUpload}
            helperText="Format accepté : images uniquement. Taille maximale : 3MB"
            files={values.images.map((url) => ({
              preview: url,
              url,
            }))}
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
