import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { Iconify } from 'src/components/iconify';
import { AnimateLogo2 } from 'src/components/animate';
import { Form, Field } from 'src/components/hook-form';

import { FormHead } from '../../components/form-head';
import { SignUpTerms } from '../../components/sign-up-terms';
import {
  signUp,
  // signInWithGithub,
  // signInWithGoogle,
  // signInWithTwitter,
} from '../../context/firebase';

// ----------------------------------------------------------------------

export const SignUpSchema = zod.object({
  fullName: zod.string().min(1, { message: 'Nom complet requis!' }),
  email: zod
    .string()
    .min(1, { message: 'Email requis!' })
    .email({ message: "L'email doit être une adresse valide!" }),
  password: zod
    .string()
    .min(1, { message: 'Mot de passe requis!' })
    .min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères!' }),
});

// ----------------------------------------------------------------------

export function FirebaseSignUpView() {
  const [errorMsg, setErrorMsg] = useState('');

  const router = useRouter();

  const password = useBoolean();

  const defaultValues = {
    fullName: '',
    email: '',
    password: '',
  };

  const methods = useForm({
    resolver: zodResolver(SignUpSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await signUp({
        email: data.email,
        password: data.password,
        displayName: data.fullName,
      });

      const searchParams = new URLSearchParams({ email: data.email }).toString();

      const href = `${paths.auth.firebase.verify}?${searchParams}`;

      router.push(href);
    } catch (error) {
      console.error(error);
      setErrorMsg(typeof error === 'string' ? error : error.message);
    }
  });

  // const handleSignInWithGoogle = async () => {
  //   try {
  //     await signInWithGoogle();
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  // const handleSignInWithGithub = async () => {
  //   try {
  //     await signInWithGithub();
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  // const handleSignInWithTwitter = async () => {
  //   try {
  //     await signInWithTwitter();
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  const renderLogo = <AnimateLogo2 sx={{ mb: 3, mx: 'auto' }} />;

  const renderForm = (
    <Box gap={3} display="flex" flexDirection="column">
      <Field.Text name="fullName" label="Nom et prénom" InputLabelProps={{ shrink: true }} />

      <Field.Text name="email" label="Adresse email" InputLabelProps={{ shrink: true }} />

      <Field.Text
        name="password"
        label="Mot de passe"
        placeholder="6+ caractères"
        type={password.value ? 'text' : 'password'}
        InputLabelProps={{ shrink: true }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={password.onToggle} edge="end">
                <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <LoadingButton
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Création du compte..."
      >
        Créer un compte
      </LoadingButton>
    </Box>
  );

  return (
    <>
      {renderLogo}

      <FormHead
        title="Commencez gratuitement"
        description={
          <>
            {`Vous avez déjà un compte? `}
            <Link component={RouterLink} href={paths.auth.firebase.signIn} variant="subtitle2">
              Connectez-vous
            </Link>
          </>
        }
        // sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      {!!errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMsg}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm}
      </Form>

      <SignUpTerms />

      {/* <FormDivider />

      <FormSocials
        signInWithGoogle={handleSignInWithGoogle}
        singInWithGithub={handleSignInWithGithub}
        signInWithTwitter={handleSignInWithTwitter}
      /> */}
    </>
  );
}
