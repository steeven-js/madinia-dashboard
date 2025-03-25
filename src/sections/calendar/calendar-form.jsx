import dayjs from 'dayjs';
import { z as zod } from 'zod';
import utc from 'dayjs/plugin/utc';
import { useSelector } from 'react-redux';
import timezone from 'dayjs/plugin/timezone';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';

import { useAuth } from 'src/hooks/use-auth';

import { uuidv4 } from 'src/utils/uuidv4';
import { fIsAfter } from 'src/utils/format-time';

import { createEvent, updateEvent, deleteEvent } from 'src/actions/calendar';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Form, Field } from 'src/components/hook-form';
import { ColorPicker } from 'src/components/color-utils';

// Ajouter les plugins dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

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

  const canModify = useMemo(() => {
    if (!currentEvent?.id) {
      return true;
    }
    return userRole === 'dev' || currentEvent?.userId === user?.uid;
  }, [userRole, currentEvent?.id, currentEvent?.userId, user?.uid]);

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(EventSchema),
    defaultValues: useMemo(() => {
      if (!currentEvent) return undefined;

      // Utiliser les dates telles qu'elles sont, sans conversion
      return {
        ...currentEvent,
        start: currentEvent.start ? dayjs(currentEvent.start).format() : undefined,
        end: currentEvent.end ? dayjs(currentEvent.end).format() : undefined,
      };
    }, [currentEvent]),
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
      // Stocker les dates telles qu'elles sont, sans conversion
      start: data?.start ? dayjs(data.start).format() : undefined,
      end: data?.end ? dayjs(data.end).format() : undefined,
    };

    try {
      if (!dateError) {
        if (currentEvent?.id) {
          const updateData = {
            ...eventData,
            userId: currentEvent.userId || '',
            userDisplayName: currentEvent.userDisplayName || 'Anonymous',
            photoURL: currentEvent.photoURL || '',
            userEmail: currentEvent.userEmail || '',
            createdAt: currentEvent.createdAt || Date.now(),
          };

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

  // État pour le modal de confirmation
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  // Gestionnaires pour le modal de confirmation
  const handleOpenConfirmDialog = () => {
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };

  // Modification de onDelete pour la confirmation
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
      handleCloseConfirmDialog();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Delete failed');
    }
  }, [currentEvent?.id, canModify, onClose]);

  return (
    <>
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
            <Field.Text name="title" label="Titre" />

            <Field.Text name="description" label="Description" multiline rows={3} />

            <Field.Switch name="allDay" label="Toute la journée" />

            <Field.MobileDateTimePicker
              name="start"
              label="Date de début"
              ampm={false}
              format="DD/MM/YYYY HH:mm"
            />

            <Field.MobileDateTimePicker
              name="end"
              label="Date de fin"
              ampm={false}
              format="DD/MM/YYYY HH:mm"
              slotProps={{
                textField: {
                  error: dateError,
                  helperText: dateError
                    ? 'La date de fin doit être postérieure à la date de début'
                    : null,
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
              <IconButton onClick={handleOpenConfirmDialog}>
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Tooltip>
          )}

          <Box sx={{ flexGrow: 1 }} />

          <Button variant="outlined" color="inherit" onClick={onClose}>
            Annuler
          </Button>

          {canModify ? (
            <LoadingButton
              type="submit"
              variant="contained"
              loading={isSubmitting}
              disabled={dateError}
            >
              Enregistrer
            </LoadingButton>
          ) : (
            <Button variant="contained" disabled>
              Lecture seule
            </Button>
          )}
        </DialogActions>
      </Form>

      {/* Modal de confirmation */}
      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="inherit">
            Annuler
          </Button>
          <Button onClick={onDelete} variant="contained" color="error" autoFocus>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
