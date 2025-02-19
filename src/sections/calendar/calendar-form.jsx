import { z as zod } from 'zod';
import { useCallback, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { useAuth } from 'src/hooks/use-auth';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';

import { uuidv4 } from 'src/utils/uuidv4';
import { fIsAfter } from 'src/utils/format-time';

import { createEvent, updateEvent, deleteEvent } from 'src/actions/calendar';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Form, Field } from 'src/components/hook-form';
import { ColorPicker } from 'src/components/color-utils';

// ----------------------------------------------------------------------

export const EventSchema = zod.object({
  title: zod
    .string()
    .min(1, { message: 'Title is required!' })
    .max(100, { message: 'Title must be less than 100 characters' }),
  description: zod
    .string()
    .min(1, { message: 'Description is required!' })
    .min(50, { message: 'Description must be at least 50 characters' }),
  // Not required
  color: zod.string(),
  allDay: zod.boolean(),
  start: zod.union([zod.string(), zod.number()]),
  end: zod.union([zod.string(), zod.number()]),
});

// ----------------------------------------------------------------------

export function CalendarForm({ currentEvent, colorOptions, onClose }) {
  const { user } = useAuth();
  const userRole = useSelector((state) => state.auth.role);

  // Vérifier si l'utilisateur a le droit de modifier/supprimer
  const canModify = useMemo(() => {
    // Si c'est un nouvel événement (pas de currentEvent.id), autoriser la création
    if (!currentEvent?.id) {
      return true;
    }
    // Sinon vérifier les permissions de modification
    return userRole === 'dev' || currentEvent?.userId === user?.uid;
  }, [userRole, currentEvent?.id, currentEvent?.userId, user?.uid]);

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(EventSchema),
    defaultValues: currentEvent,
  });

  const {
    reset,
    watch,
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  const dateError = fIsAfter(values.start, values.end);

  const onSubmit = handleSubmit(async (data) => {
    const eventData = {
      id: currentEvent?.id ? currentEvent?.id : uuidv4(),
      color: data?.color,
      title: data?.title,
      allDay: data?.allDay,
      description: data?.description,
      end: data?.end,
      start: data?.start,
    };

    try {
      if (!dateError) {
        if (currentEvent?.id) {
          // S'assurer que toutes les propriétés ont des valeurs par défaut
          const updateData = {
            ...eventData,
            userId: currentEvent.userId || '',
            userDisplayName: currentEvent.userDisplayName || 'Anonymous',
            photoURL: currentEvent.photoURL || '',
            userEmail: currentEvent.userEmail || '',
            createdAt: currentEvent.createdAt || Date.now(),
          };

          // Filtrer les propriétés undefined
          const cleanedData = Object.fromEntries(
            Object.entries(updateData).filter(([_, value]) => value !== undefined)
          );

          await updateEvent(cleanedData);
          toast.success('Update success!');
        } else {
          await createEvent(eventData);
          toast.success('Create success!');
        }
        onClose();
        reset();
      }
    } catch (error) {
      console.error(error);
      toast.error('Operation failed');
    }
  });

  const onDelete = useCallback(async () => {
    try {
      // Vérifier les permissions
      if (!canModify) {
        toast.error("Vous n'avez pas les permissions nécessaires");
        return;
      }

      // Utiliser directement l'ID de l'événement
      if (!currentEvent?.id) {
        throw new Error('Event ID is missing');
      }

      await deleteEvent(currentEvent.id);
      toast.success('Delete success!');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Delete failed');
    }
  }, [currentEvent?.id, canModify, onClose]);

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Scrollbar sx={{ p: 3, bgcolor: 'background.neutral' }}>
        {/* Afficher l'avatar et le nom du créateur */}
        {currentEvent?.id && (
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Avatar src={currentEvent.photoURL} alt={currentEvent.userDisplayName}>
              {currentEvent.userDisplayName?.charAt(0)}
            </Avatar>
            <Typography variant="subtitle2">Créé par {currentEvent.userDisplayName}</Typography>
          </Stack>
        )}

        <Stack spacing={3}>
          <Field.Text name="title" label="Title" />

          <Field.Text name="description" label="Description" multiline rows={3} />

          <Field.Switch name="allDay" label="All day" />

          <Field.MobileDateTimePicker name="start" label="Start date" />

          <Field.MobileDateTimePicker
            name="end"
            label="End date"
            slotProps={{
              textField: {
                error: dateError,
                helperText: dateError ? 'End date must be later than start date' : null,
              },
            }}
          />

          <Controller
            name="color"
            control={control}
            render={({ field }) => (
              <ColorPicker
                selected={field.value}
                onSelectColor={(color) => field.onChange(color)}
                colors={colorOptions}
              />
            )}
          />
        </Stack>
      </Scrollbar>

      <DialogActions sx={{ flexShrink: 0 }}>
        {!!currentEvent?.id && canModify && (
          <Tooltip title="Delete event">
            <IconButton onClick={onDelete}>
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Tooltip>
        )}

        <Box sx={{ flexGrow: 1 }} />

        <Button variant="outlined" color="inherit" onClick={onClose}>
          Cancel
        </Button>

        {canModify ? (
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting}
            disabled={dateError}
          >
            Save changes
          </LoadingButton>
        ) : (
          <Button variant="contained" disabled>
            Lecture seule
          </Button>
        )}
      </DialogActions>
    </Form>
  );
}
