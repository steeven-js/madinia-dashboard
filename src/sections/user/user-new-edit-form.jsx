import { z as zod } from 'zod';
import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import DialogContentText from '@mui/material/DialogContentText';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { deleteUserCompletely, updateOrCreateUserData } from 'src/hooks/use-users';

import { fData } from 'src/utils/format-number';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export const NewUserSchema = zod.object({
  avatarUrl: schemaHelper.file({
    message: { required_error: 'Avatar is required!' },
  }),
  displayName: zod.string(),
  email: zod.string().email({ message: 'Email must be a valid email address!' }).optional(),
  phoneNumber: schemaHelper.phoneNumber({ isValidPhoneNumber }).optional(),
  country: schemaHelper.objectOrNull().optional(),
  address: zod.string().optional(),
  company: zod.string().optional(),
  state: zod.string().optional(),
  city: zod.string().optional(),
  role: zod.string().optional(),
  zipCode: zod.string().optional(),
  // Not required fields (unchanged)
  status: zod.string(),
  isVerified: zod.boolean(),
  isBanned: zod.boolean(),
});

// ----------------------------------------------------------------------

export function UserNewEditForm({ currentUser }) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // console.log('currentUser', currentUser);

  const defaultValues = useMemo(
    () => ({
      status: currentUser?.status ?? '',
      avatarUrl: currentUser?.avatarUrl || null,
      isVerified: currentUser?.isVerified ?? false,
      isBanned: currentUser?.isBanned ?? false,
      displayName: currentUser?.displayName ?? '',
      email: currentUser?.email ?? '',
      phoneNumber: currentUser?.phoneNumber ?? '',
      country: currentUser?.country ?? null,
      state: currentUser?.state ?? '',
      city: currentUser?.city ?? '',
      address: currentUser?.address ?? '',
      zipCode: currentUser?.zipCode ?? '',
      company: currentUser?.company ?? '',
      role: currentUser?.role ?? '',
    }),
    [currentUser]
  );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(NewUserSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await updateOrCreateUserData({ currentUser, data });
      reset();
      toast.success(currentUser ? 'Mise à jour réussie !' : 'Création réussie !');
      router.push(paths.dashboard.user.list);
      console.info('DATA', data);
    } catch (error) {
      console.error(error);
    }
  });

  const handleDeleteUser = async () => {
    if (!currentUser?.id) return;

    setIsDeleting(true);
    try {
      await deleteUserCompletely(currentUser.id);
      toast.success('Utilisateur supprimé avec succès !');
      router.push(paths.dashboard.user.list);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error("Erreur lors de la suppression de l'utilisateur");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={4}>
          <Card sx={{ pt: 10, pb: 5, px: 3 }}>
            {currentUser && (
              <Label
                color={
                  (values.status === 'active' && 'success') ||
                  (values.status === 'banned' && 'error') ||
                  'warning'
                }
                sx={{ position: 'absolute', top: 24, right: 24 }}
              >
                {values.status}
              </Label>
            )}

            <Box sx={{ mb: 5 }}>
              <Field.UploadAvatar
                name="avatarUrl"
                maxSize={3145728}
                helperText={
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 3,
                      mx: 'auto',
                      display: 'block',
                      textAlign: 'center',
                      color: 'text.disabled',
                    }}
                  >
                    Allowed *.jpeg, *.jpg, *.png, *.gif
                    <br /> max size of {fData(3145728)}
                  </Typography>
                }
              />
            </Box>

            {currentUser && (
              <FormControlLabel
                labelPlacement="start"
                control={
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        {...field}
                        checked={field.value !== 'active'}
                        onChange={(event) =>
                          field.onChange(event.target.checked ? 'banned' : 'active')
                        }
                      />
                    )}
                  />
                }
                label={
                  <>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      Banned
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Apply disable account
                    </Typography>
                  </>
                }
                sx={{
                  mx: 0,
                  mb: 3,
                  width: 1,
                  justifyContent: 'space-between',
                }}
              />
            )}

            <Field.Switch
              name="isVerified"
              labelPlacement="start"
              label={
                <>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    Email verified
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Disabling this will automatically send the user a verification email
                  </Typography>
                </>
              }
              sx={{ mx: 0, width: 1, justifyContent: 'space-between' }}
            />

            {currentUser && (
              <Stack justifyContent="center" alignItems="center" sx={{ mt: 3 }}>
                <Button variant="soft" color="error" onClick={() => setDeleteDialogOpen(true)}>
                  Supprimer l&apos;utilisateur
                </Button>
              </Stack>
            )}
          </Card>
        </Grid>

        <Grid xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
            >
              <Field.Text name="displayName" label="Full name" />
              <Field.Text name="email" label="Email address" />
              <Field.Phone name="phoneNumber" label="Phone number" />

              <Field.CountrySelect
                fullWidth
                name="country"
                label="Country"
                placeholder="Choose a country"
              />

              <Field.Text name="state" label="State/region" />
              <Field.Text name="city" label="City" />
              <Field.Text name="address" label="Address" />
              <Field.Text name="zipCode" label="Zip/code" />
              <Field.Text name="company" label="Company" />
              <Field.Text name="role" label="Role" />
            </Box>

            <Stack alignItems="flex-end" sx={{ mt: 3 }}>
              <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                {!currentUser ? 'Create user' : 'Save changes'}
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Dialogue de confirmation de suppression */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ? Cette action
            supprimera l&apos;utilisateur de Firebase Auth, de la base de données Firestore et tous
            les fichiers associés dans Storage. Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Annuler
          </Button>
          <LoadingButton
            onClick={handleDeleteUser}
            color="error"
            variant="contained"
            loading={isDeleting}
          >
            Supprimer
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Form>
  );
}
