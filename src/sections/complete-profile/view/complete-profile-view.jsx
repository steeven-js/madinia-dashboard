import { toast } from 'sonner';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';

import { db } from 'src/utils/firebase';

import { Iconify } from 'src/components/iconify';

export default function CompleteProfileView() {
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    about: '',
    address: '',
    city: '',
    company: '',
    country: '',
    phoneNumber: '',
    state: '',
    zipCode: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authUser?.id) {
      toast.error('Vous devez être connecté pour compléter votre profil');
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'users', authUser.id);
      await updateDoc(userRef, {
        ...formData,
        isPublic: true,
        updatedAt: new Date(),
      });

      toast.success('Votre profil a été complété avec succès !');

      setTimeout(() => {
        navigate(paths.dashboard.root);
      }, 1500);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      toast.error('Une erreur est survenue lors de la mise à jour du profil');
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          py: 5,
          width: '100%',
          mx: 'auto',
        }}
      >
        <Stack spacing={3} alignItems="center" sx={{ mb: 5 }}>
          <Typography variant="h3">Complétez votre profil</Typography>

          <Typography sx={{ color: 'text.secondary' }}>
            Pour continuer, veuillez compléter les informations suivantes
          </Typography>
        </Stack>

        <Card sx={{ p: 5 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={5}>
              {/* Section Informations Personnelles */}
              <div>
                <Typography variant="h6" sx={{ mb: 3, color: 'text.primary' }}>
                  Informations Personnelles
                </Typography>
                <Stack spacing={3}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                      fullWidth
                      name="company"
                      label="Entreprise"
                      value={formData.company}
                      onChange={handleChange}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Iconify icon="solar:building-bold" />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <TextField
                      fullWidth
                      name="phoneNumber"
                      label="Numéro de téléphone"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Iconify icon="solar:phone-bold" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Stack>

                  <TextField
                    fullWidth
                    name="about"
                    label="À propos"
                    value={formData.about}
                    onChange={handleChange}
                    multiline
                    rows={3}
                    placeholder="Parlez-nous un peu de vous..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Iconify icon="solar:user-id-bold" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Stack>
              </div>

              <Divider />

              {/* Section Adresse */}
              <div>
                <Typography variant="h6" sx={{ mb: 3, color: 'text.primary' }}>
                  Adresse
                </Typography>
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    name="address"
                    label="Adresse"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Iconify icon="solar:home-2-bold" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                      fullWidth
                      name="city"
                      label="Ville"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Iconify icon="solar:city-bold" />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <TextField
                      fullWidth
                      name="zipCode"
                      label="Code postal"
                      value={formData.zipCode}
                      onChange={handleChange}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Iconify icon="solar:hashtag-square-bold" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Stack>

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                      fullWidth
                      name="state"
                      label="Région"
                      value={formData.state}
                      onChange={handleChange}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Iconify icon="solar:map-point-bold" />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <TextField
                      fullWidth
                      name="country"
                      label="Pays"
                      value={formData.country}
                      onChange={handleChange}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Iconify icon="solar:globe-bold" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Stack>
                </Stack>
              </div>

              <LoadingButton
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                loading={loading}
                startIcon={<Iconify icon="solar:check-circle-bold" />}
              >
                Enregistrer
              </LoadingButton>
            </Stack>
          </form>
        </Card>
      </Box>
    </Container>
  );
}
