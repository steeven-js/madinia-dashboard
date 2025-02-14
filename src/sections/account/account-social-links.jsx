import { useForm } from 'react-hook-form';

import Card from '@mui/material/Card';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { updateOrCreateUserData } from 'src/hooks/use-users';

import { TwitterIcon, FacebookIcon, LinkedinIcon, InstagramIcon } from 'src/assets/icons';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export function AccountSocialLinks({ userProfile }) {
  const defaultValues = {
    facebook: userProfile?.facebookLink || '',
    instagram: userProfile?.instagramLink || '',
    linkedin: userProfile?.linkedinLink || '',
    twitter: userProfile?.twitterLink || '',
  };

  const methods = useForm({ defaultValues });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const formattedData = {
        facebookLink: data.facebook,
        instagramLink: data.instagram,
        linkedinLink: data.linkedin,
        twitterLink: data.twitter,
      };

      await updateOrCreateUserData({
        currentUser: userProfile,
        data: formattedData,
      });

      toast.success('Réseaux sociaux mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour des réseaux sociaux:', error);
      toast.error('Erreur lors de la mise à jour des réseaux sociaux');
    }
  });

  const socialLinks = {
    facebook: { icon: <FacebookIcon width={24} />, placeholder: 'https://facebook.com/...' },
    instagram: { icon: <InstagramIcon width={24} />, placeholder: 'https://instagram.com/...' },
    linkedin: { icon: <LinkedinIcon width={24} />, placeholder: 'https://linkedin.com/in/...' },
    twitter: {
      icon: <TwitterIcon width={24} sx={{ color: 'text.primary' }} />,
      placeholder: 'https://twitter.com/...',
    },
  };

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3, gap: 3, display: 'flex', flexDirection: 'column' }}>
        {Object.entries(socialLinks).map(([social, { icon, placeholder }]) => (
          <Field.Text
            key={social}
            name={social}
            label={social.charAt(0).toUpperCase() + social.slice(1)}
            placeholder={placeholder}
            InputProps={{
              startAdornment: <InputAdornment position="start">{icon}</InputAdornment>,
            }}
          />
        ))}

        <LoadingButton type="submit" variant="contained" loading={isSubmitting} sx={{ ml: 'auto' }}>
          Enregistrer les modifications
        </LoadingButton>
      </Card>
    </Form>
  );
}
