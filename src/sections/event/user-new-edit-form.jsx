import { z as zod } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import { Button, MenuItem, IconButton } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { createOrUpdateEvent } from 'src/hooks/use-event';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaHelper } from 'src/components/hook-form';
import useImageUpload from 'src/hooks/use-event-image';
import { db, storage } from 'src/utils/firebase';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

// ----------------------------------------------------------------------

export const NewEventSchema = zod.object({
  title: zod.string().min(1, { message: 'Title is required!' }),
  status: zod.string(),
  date: schemaHelper.date({
    message: { required_error: 'Date is required!' },
  }),
  location: zod.string().min(1, { message: 'Location is required!' }),
  price: zod.number().min(0, { message: 'Price must be 0 or more' }),
  description: zod.string().min(1, { message: 'Description is required!' }),
  images: schemaHelper.files({
    message: { required_error: 'Images is required!' },
  }),
  speakers: zod.array(zod.string()),
  participants: zod.object({
    max: zod.number().min(1, { message: 'Maximum participants must be more than 0' }),
    current: zod.number(),
  }),
});

// ----------------------------------------------------------------------

export function EventNewEditForm({ event: currentEvent }) {
  const router = useRouter();

  const { removeImage, removeAllImages, isUploading } = useImageUpload(currentEvent?.id);

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
    reset,
    watch,
    setValue,
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

          const fileName = `events/${currentEvent?.id || 'temp'}/${Date.now()}_${file.name}`;
          const storageRef = ref(storage, fileName);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);

          if (currentEvent) {
            const eventRef = doc(db, 'events', currentEvent.id);
            await updateDoc(eventRef, {
              images: arrayUnion(url),
            });
          }

          return url;
        })
      );

      // Update the form value with new images
      setValue('images', [...values.images, ...uploadedUrls]);
      toast.success('Images uploaded successfully!');
      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
      throw error;
    }
  };

  const onSubmit = async (data) => {
    try {
      // Appel à la fonction createOrUpdateEvent
      const response = await createOrUpdateEvent(data, currentEvent?.id);
      if (response.success) {
        toast.success(currentEvent ? 'Update success!' : 'Create success!');
        // Reset avec les nouvelles données
        if (response.data) {
          reset(response.data);
        }
        // Redirection
        // router.push(paths.dashboard.event.root);
      } else {
        toast.error(response.error || 'Operation failed');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(error.message || 'An unexpected error occurred');
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
      <CardHeader title="Details" subheader="Title, short description, image..." sx={{ mb: 3 }} />

      <Divider />

      <Stack spacing={3} sx={{ p: 3 }}>
        <Field.Text name="title" label="Event Title" required />

        <Field.Select fullWidth name="status" label="Status">
          {['draft', 'current', 'past', 'cancelled'].map((option) => (
            <MenuItem key={option} value={option} sx={{ textTransform: 'capitalize' }}>
              {option}
            </MenuItem>
          ))}
        </Field.Select>

        <Stack spacing={1.5}>
          <Typography variant="subtitle2">Images</Typography>
          <Field.Upload
            multiple
            thumbnail
            name="images"
            maxSize={3145728}
            onRemove={handleRemoveFile}
            onRemoveAll={handleRemoveAllFiles}
            onDrop={handleUpload} // Changed from onUpload to onDrop
            files={values.images.map((url) => ({
              preview: url,
              url: url,
            }))}
          />
        </Stack>
      </Stack>
    </Card>
  );

  const renderProperties = (
    <Card>
      <CardHeader
        title="Properties"
        subheader="Additional functions and attributes..."
        sx={{ mb: 3 }}
      />

      <Divider />

      <Stack spacing={2} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ color: 'text.disabled', mb: 3 }}>
          Speakers:
        </Typography>

        {fields.map((field, index) => (
          <Stack key={field.id} direction="row" spacing={2} alignItems="center">
            <Field.Text name={`speakers.${index}`} label={`Speaker ${index + 1}`} required />
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
          Add Speaker
        </Button>
      </Stack>
    </Card>
  );

  const renderPricing = (
    <Card>
      <CardHeader title="Pricing" subheader="Price related inputs" sx={{ mb: 3 }} />

      <Divider />

      <Stack spacing={3} sx={{ p: 3 }}>
        <Field.Text
          name="price"
          label="Regular price"
          placeholder="0.00"
          type="number"
          InputLabelProps={{ shrink: true }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Box component="span" sx={{ color: 'text.disabled' }}>
                  $
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
      <LoadingButton
        type="submit"
        variant="contained"
        size="large"
        onClick={onSubmit}
        loading={isSubmitting}
      >
        {!currentEvent ? 'Create event' : 'Save changes'}
      </LoadingButton>

      <Button variant="outlined" size="large" onClick={onSubmit}>
        {!currentEvent ? 'Create event' : 'Save changes'}
      </Button>
    </Stack>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={{ xs: 3, md: 5 }} sx={{ mx: 'auto', maxWidth: { xs: 720, xl: 880 } }}>
        {renderDetails}

        {renderProperties}

        {renderPricing}

        {renderActions}
      </Stack>
    </Form>
  );
}
