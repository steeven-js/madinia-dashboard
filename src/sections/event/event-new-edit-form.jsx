import { z as zod } from 'zod';
import { toast } from 'sonner';
import { useMemo, useEffect, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

// import useImageUpload from 'src/hooks/use-event-image';

import { doc, updateDoc } from 'firebase/firestore';

import { deleteEventImage, handleEventSubmit } from 'src/hooks/use-event';

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
  isScheduledDate: zod.boolean(),
  scheduledDate: schemaHelper.date({
    message: { required_error: 'La date programmée est requise !' },
  }),
  price: zod.number().min(0, { message: 'Le prix doit être de 0 ou plus' }),
  description: zod.string().min(1, { message: 'La description est requise !' }),
  image: schemaHelper.file({
    message: { required_error: 'Single upload is required!' },
  }),
  isFree: zod.boolean(),
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

  // const { removeImage, removeAllImages } = useImageUpload(currentEvent?.id);

  const defaultValues = useMemo(
    () => ({
      title: currentEvent?.title || '',
      status: currentEvent?.status || 'draft',
      date: currentEvent?.date || null,
      scheduledDate: currentEvent?.scheduledDate || null,
      location: currentEvent?.location || '',
      isFree: currentEvent?.isFree ?? false,
      price: currentEvent?.price || 0,
      description: currentEvent?.description || '',
      image: currentEvent?.image || '',
      // images: currentEvent?.images || [],
      speakers: currentEvent?.speakers || [],
      stripeEventId: currentEvent?.stripeEventId || '',
      participants: {
        max: currentEvent?.participants?.max || 10,
        current: currentEvent?.participants?.current || 0,
      },
      isScheduledDate: currentEvent?.isScheduledDate || false,
      isActive: currentEvent?.isActive || false,
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

  /**
   * Supprime l'image actuelle
   */
  const handleRemoveFile = useCallback(() => {
    setValue('image', null);
  }, [setValue]);

  /**
   * Gère l'upload d'une seule image
   * @param {File|File[]} acceptedFile - Fichier ou tableau de fichiers
   * @returns {Promise<string>} URL de l'image uploadée
   */
  const handleOneUpload = async (acceptedFile) => {
    try {
      // Si on reçoit un tableau, prendre le premier fichier
      const file = Array.isArray(acceptedFile) ? acceptedFile[0] : acceptedFile;

      const fileName = `events/${currentEvent?.id || Date.now()}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      setValue('image', url);
      toast.success('Image uploadée avec succès!');
      return url;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error("Échec de l'upload de l'image");
      throw error;
    }
  };

  // Modifier le onSubmit
  const onSubmit = async (data) => {
    try {
      // L'image est déjà uploadée par handleOneUpload, pas besoin de le refaire
      const result = await handleEventSubmit(data, currentEvent);

      if (result.success) {
        toast.success(result.message);
        router.push(paths.dashboard.event.root);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event');
    }
  };

  const renderDetails = (
    <Card>
      <CardHeader title="Détails" subheader="Titre, description courte, image..." sx={{ mb: 3 }} />

      <Divider />

      <Stack spacing={3} sx={{ p: 3 }}>
        <Field.Text name="title" label="Titre de l'événement" required />

        <Field.MobileDateTimePicker name="date" label="Date de l'événement" required />

        <Field.Switch name="isScheduledDate" label="Date Programmée" />

        {values.isScheduledDate && (
          <Field.MobileDateTimePicker name="scheduledDate" label="Date programmée" required />
        )}

        <Field.Select fullWidth name="status" label="Statut">
          {[
            { value: 'draft', label: 'Brouillon' },
            { value: 'pending', label: 'Programmé' },
            { value: 'current', label: 'En cours' },
            { value: 'past', label: 'Terminé' },
            { value: 'cancelled', label: 'Annulé' },
          ].map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field.Select>

        <Field.Text name="location" label="Lieu" required />

        <Field.Text name="description" label="Description" multiline rows={4} required />

        <Stack spacing={1.5}>
          <Typography variant="subtitle2">Image Principale</Typography>
          <Field.Upload
            single
            name="image"
            maxSize={3145728}
            onDrop={handleOneUpload}
            onDelete={handleRemoveFile}
            helperText="Format accepté : image uniquement. Taille maximale : 3MB"
            file={
              values.image
                ? {
                    preview: values.image,
                    url: values.image,
                    type: 'image/*',
                  }
                : null
            }
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
          name="participants.max"
          label="Nombre maximum de participants"
          type="number"
          required
          InputProps={{
            inputProps: { min: 1 },
          }}
        />

        <Field.Switch name="isFree" label="Événement gratuit" />

        {!values.isFree && (
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
        )}
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
