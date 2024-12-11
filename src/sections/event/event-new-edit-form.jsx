import { z as zod } from 'zod';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useEffect, useCallback } from 'react';
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

import { handleEventSubmit } from 'src/hooks/use-event';

import { storage } from 'src/utils/firebase';

import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------

// Schema definition remains the same...
export const NewEventSchema = zod.object({
  title: zod.string().optional(),
  status: zod.string().optional(),
  location: zod.string().optional(),
  date: schemaHelper.date().optional(),
  isScheduledDate: zod.boolean().optional(),
  scheduledDate: schemaHelper.date().optional().nullable(),
  price: zod.number().optional(),
  description: zod.string().optional(),
  image: schemaHelper.file().optional(),
  isFree: zod.boolean().optional(),
  links: zod
    .array(
      zod.object({
        url: zod.string().url('URL invalide').optional(),
        label: zod.string().optional(),
      })
    )
    .optional(),
  participants: zod
    .object({
      max: zod.number().optional(),
      current: zod.number().optional(),
    })
    .optional(),
});

// ----------------------------------------------------------------------

export function EventNewEditForm({ event: currentEvent }) {
  const router = useRouter();

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
      links: currentEvent?.links || [{ url: '', label: '' }],
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
    name: 'links',
  });

  const {
    watch,
    reset,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  // Reset form when currentEvent changes
  useEffect(() => {
    if (currentEvent) {
      reset(defaultValues);
    }
  }, [currentEvent, defaultValues, reset]);

  // Combined date synchronization logic
  useEffect(() => {
    if (!values.isScheduledDate) {
      // When isScheduledDate is false, always sync scheduledDate with date
      if (values.date !== values.scheduledDate) {
        setValue('scheduledDate', values.date);
      }
    } else if (!values.scheduledDate) {
      // When isScheduledDate is true and scheduledDate is not set, initialize it with date
      setValue('scheduledDate', values.date);
    }
  }, [values.isScheduledDate, values.date, values.scheduledDate, setValue]);

  const handleDateChange = useCallback(
    (newDate) => {
      setValue('date', newDate);
      if (!values.isScheduledDate) {
        setValue('scheduledDate', newDate);
      }
    },
    [setValue, values.isScheduledDate]
  );

  const handleScheduledToggle = useCallback(
    (e) => {
      const checked = e.target.checked;
      setValue('isScheduledDate', checked);
      if (!checked) {
        setValue('scheduledDate', values.date);
      }
    },
    [setValue, values.date]
  );

  const handleRemoveFile = useCallback(() => {
    setValue('image', null);
  }, [setValue]);

  const handleOneUpload = async (acceptedFile) => {
    try {
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

  const onSubmit = async (data) => {
    try {
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
        <Field.Text name="title" label="Titre de l'événement" />
        <Field.MobileDateTimePicker
          name="date"
          label="Date de l'événement"
          onChange={handleDateChange}
        />
        <Field.Switch
          name="isScheduledDate"
          label="Date Programmée"
          onChange={handleScheduledToggle}
        />
        {values.isScheduledDate && (
          <Field.MobileDateTimePicker name="scheduledDate" label="Date programmée" />
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
        <Field.Text name="location" label="Lieu" />
        <Field.Text name="description" label="Description" multiline rows={4} />
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
          Liens :
        </Typography>
        {fields.map((field, index) => (
          <Stack key={field.id} direction="row" spacing={2} alignItems="center">
            <Field.Text
              name={`links.${index}.label`}
              label="Label"
              placeholder="Ex: Site web, Facebook..."
              sx={{ width: '30%' }}
            />
            <Field.Text
              name={`links.${index}.url`}
              label="URL"
              placeholder="https://"
              sx={{ flex: 1 }}
            />
            <IconButton onClick={() => remove(index)} color="error" sx={{ mt: 2 }}>
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Stack>
        ))}
        <Button
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => append({ url: '', label: '' })}
          variant="soft"
        >
          Ajouter un lien
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
