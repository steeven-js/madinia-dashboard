import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { updateOrCreateUserData } from 'src/hooks/use-users';

import { auth } from 'src/utils/firebase';
import { fData } from 'src/utils/format-number';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export const UpdateUserSchema = zod.object({
  displayName: zod.string().min(1, { message: 'Le nom est requis !' }),
  email: zod
    .string()
    .min(1, { message: "L'email est requis !" })
    .email({ message: "L'email doit être une adresse valide !" }),
  avatarUrl: schemaHelper.file({
    message: { required_error: "L'avatar est requis !" },
  }),
  coverUrl: schemaHelper
    .file({
      message: { required_error: "L'image de couverture est requise !" },
    })
    .nullable(),
  phoneNumber: schemaHelper.phoneNumber({ isValidPhoneNumber }),
  country: schemaHelper.objectOrNull({
    message: { required_error: 'Le pays est requis !' },
  }),
  address: zod.string().min(1, { message: "L'adresse est requise !" }),
  state: zod.string().min(1, { message: 'La région est requise !' }),
  city: zod.string().min(1, { message: 'La ville est requise !' }),
  zipCode: zod.string().min(1, { message: 'Le code postal est requis !' }),
  about: zod.string().min(1, { message: 'La description est requise !' }),
  isPublic: zod.boolean(),
});

export function AccountGeneral({ currentUser, userProfile }) {
  const router = useRouter();
  const [_isSubmitting, setIsSubmitting] = useState(false);

  // S'assurer que currentUser a toujours un ID
  const currentUserWithId = {
    id: auth.currentUser?.uid,
    ...currentUser,
  };

  const defaultValues = {
    displayName: userProfile?.displayName || '',
    email: userProfile?.email || '',
    avatarUrl: userProfile?.avatarUrl || null,
    coverUrl: userProfile?.coverUrl || null,
    phoneNumber: userProfile?.phoneNumber || '',
    country: userProfile?.country || '',
    address: userProfile?.address || '',
    state: userProfile?.state || '',
    city: userProfile?.city || '',
    zipCode: userProfile?.zipCode || '',
    about: userProfile?.about || '',
    isPublic: userProfile?.isPublic || false,
  };

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(UpdateUserSchema),
    defaultValues,
  });

  const {
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const handleRemoveFile = useCallback(() => {
    setValue('coverUrl', null);
  }, [setValue]);

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      await updateOrCreateUserData({
        currentUser: currentUserWithId,
        data,
      });

      router.push(paths.dashboard.root);
    } catch (error) {
      console.error(error);
      toast.error('Une erreur est survenue lors de la mise à jour');
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={4}>
          <Card
            sx={{
              pt: 10,
              pb: 5,
              px: 3,
              textAlign: 'center',
            }}
          >
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
                  Formats autorisés *.jpeg, *.jpg, *.png, *.gif
                  <br /> taille maximum de {fData(3145728)}
                </Typography>
              }
            />

            <Field.Switch
              name="isPublic"
              labelPlacement="start"
              label="Profil public"
              value={userProfile?.isPublic ? 'true' : 'false'}
              sx={{ mt: 5 }}
            />

            <Button variant="soft" color="error" sx={{ mt: 3 }}>
              Supprimer l&apos;utilisateur
            </Button>
          </Card>
        </Grid>

        <Grid xs={12} md={8}>
          <Stack spacing={3}>
            {/* Zone 1: Informations personnelles */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Informations personnelles
              </Typography>

              <Box
                rowGap={3}
                columnGap={2}
                display="grid"
                gridTemplateColumns={{
                  xs: 'repeat(1, 1fr)',
                  sm: 'repeat(2, 1fr)',
                }}
              >
                <Field.Text name="displayName" label="Nom complet" />
                <Field.Text name="email" label="Adresse e-mail" />
                <Field.Phone name="phoneNumber" label="Numéro de téléphone" />
                <Field.Text name="address" label="Adresse" />
                <Field.CountrySelect name="country" label="Pays" placeholder="Choisir un pays" />
                <Field.Text name="state" label="Région" />
                <Field.Text name="city" label="Ville" />
                <Field.Text name="zipCode" label="Code postal" />
              </Box>

              <Stack spacing={3} alignItems="flex-end" sx={{ mt: 3 }}>
                <Field.Text name="about" multiline rows={4} label="À propos" />
              </Stack>
            </Card>

            {/* Zone 2: Images */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Images du profil
              </Typography>

              <Stack spacing={3}>
                {/* Cover */}
                <Stack spacing={1.5}>
                  <Field.Upload name="coverUrl" maxSize={3145728} onDelete={handleRemoveFile} />
                </Stack>
              </Stack>
            </Card>

            <Stack alignItems="flex-end">
              <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                Enregistrer les modifications
              </LoadingButton>
            </Stack>
          </Stack>
        </Grid>
      </Grid>
    </Form>
  );
}
