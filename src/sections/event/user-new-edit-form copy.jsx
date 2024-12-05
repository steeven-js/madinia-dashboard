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
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const NewEventSchema = zod.object({
  title: zod.string().min(1, 'Title is required'),
  status: zod.string(),
  date: zod
    .union([
      zod.string().refine((val) => !isNaN(new Date(val).getTime()), 'Invalid date'),
      zod.date(),
    ])
    .transform((val) => new Date(val)),
  location: zod.string().min(1, 'Location is required'),
  price: zod
    .number({
      required_error: 'Price is required',
      invalid_type_error: 'Price must be a number',
    })
    .min(0, 'Price must be 0 or more'),
  description: zod.string().min(1, 'Description is required'),
  images: zod.array(zod.any()).optional().default([]), // Simplified for compatibility
  speakers: zod.array(zod.string()).optional().default([]),
  participants: zod.object({
    max: zod
      .number({
        required_error: 'Maximum participants is required',
        invalid_type_error: 'Maximum participants must be a number',
      })
      .min(1, 'Maximum participants must be more than 0'),
    current: zod.number().default(0),
  }),
});

// ----------------------------------------------------------------------

export function EventNewEditForm({ event: currentEvent }) {
  const router = useRouter();

  const defaultValues = useMemo(
    () => ({
      title: currentEvent?.title || '',
      status: currentEvent?.status || 'draft',
      date: currentEvent?.date || new Date(),
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

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = methods;

  const values = watch();

  const onSubmit = handleSubmit(async (data) => {
    console.log('Submitting data:', data);

    try {
      const response = await createOrUpdateEvent(data, currentEvent?.id);
      if (response.success) {
        toast.success(currentEvent ? 'Update success!' : 'Create success!');
        reset(response.data || defaultValues);
        router.push(paths.dashboard.event.root);
      } else {
        toast.error(response.error || 'Operation failed');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Unexpected error occurred');
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={3} sx={{ mx: 'auto', maxWidth: 720 }}>
        <Card>
          <CardHeader title="Details" />
          <Stack spacing={3} sx={{ p: 3 }}>
            <Field.Text
              name="title"
              label="Event Title"
              required
              error={Boolean(errors.title)}
              helperText={errors.title?.message}
            />
            <Field.Select
              name="status"
              label="Status"
              fullWidth
              error={Boolean(errors.status)}
              helperText={errors.status?.message}
            >
              {['draft', 'current', 'past', 'cancelled'].map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Field.Select>
          </Stack>
        </Card>

        <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
          {currentEvent ? 'Save Changes' : 'Create Event'}
        </LoadingButton>
      </Stack>
    </Form>
  );
}
