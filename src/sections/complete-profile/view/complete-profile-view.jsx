import { useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
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

import { useUserById } from 'src/hooks/use-users';

import { db } from 'src/utils/firebase';

import { Iconify } from 'src/components/iconify';

export default function CompleteProfileView() {
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth.user);
  const { user, loading: userLoading } = useUserById(authUser?.uid);
  const [loading, setLoading] = useState(false);

  const isProfileComplete = (userData) => {
    if (!userData) return false;

    const requiredFields = [
      'address',
      'city',
      'company',
      'country',
      'phoneNumber',
      'state',
      'zipCode',
    ];

    return requiredFields.every((field) => !!userData[field]);
  };

  useEffect(() => {
    if (user && isProfileComplete(user)) {
      navigate(paths.dashboard.root);
    }
  }, [user, navigate]);

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

  // Initialiser le formulaire avec les données existantes
  useEffect(() => {
    if (user) {
      setFormData({
        about: user.about || '',
        address: user.address || '',
        city: user.city || '',
        company: user.company || '',
        country: user.country || '',
        phoneNumber: user.phoneNumber || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authUser?.uid) {
      console.error('Aucun utilisateur connecté');
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'users', authUser.uid);
      await updateDoc(userRef, {
        ...formData,
        isPublic: true,
        updatedAt: new Date(),
      });
      navigate(paths.dashboard.user.account(authUser.uid));
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
    }
    setLoading(false);
  };

  if (userLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <LoadingButton loading />
      </Box>
    );
  }

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
